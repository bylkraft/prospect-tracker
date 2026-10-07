import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'

import { DEFAULT_TJM_REFERENCE } from './defaults'

// Source of truth for the data model. Rationale & reference:
// docs/reference/data-model.md + docs/decisions/0001-user-configurable-pipeline.md.

export const planEnum = pgEnum('plan', ['free', 'pro'])

export const STAGE_COLOR_TOKENS = [
  'slate',
  'blue',
  'teal',
  'green',
  'amber',
  'orange',
  'red',
  'rose',
  'violet',
  'pink'
] as const

export type StageColorToken = (typeof STAGE_COLOR_TOKENS)[number]

// null = free stage, neutral in every KPI — see docs/reference/kpis.md
export const STAGE_SYSTEM_KEY = {
  SAVED: 'saved',
  CONTACTED: 'contacted',
  CV_SENT: 'cv_sent',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
  GHOSTED: 'ghosted'
} as const

export type StageSystemKey = (typeof STAGE_SYSTEM_KEY)[keyof typeof STAGE_SYSTEM_KEY]

const STAGE_SYSTEM_KEYS = Object.values(STAGE_SYSTEM_KEY)

// Outcomes, not steps: the opportunity is over, so it raises no follow-up, whether or not its
// stage is archived. Says nothing about whether a reply came — Refusé is one, Ghosté is the
// absence of one; that split lives in the response rate. See docs/reference/kpis.md
export const TERMINAL_STAGE_KEYS: readonly StageSystemKey[] = [
  STAGE_SYSTEM_KEY.REJECTED,
  STAGE_SYSTEM_KEY.GHOSTED
]

export const CONTACT_RELATIONSHIPS = ['esn_manager', 'end_client', 'freelance', 'other'] as const

export type ContactRelationship = (typeof CONTACT_RELATIONSHIPS)[number]

export const PHONE_LABELS = ['mobile', 'office'] as const
export const EMAIL_LABELS = ['work', 'personal'] as const

export type PhoneLabel = (typeof PHONE_LABELS)[number]
export type EmailLabel = (typeof EMAIL_LABELS)[number]

export type ContactPhone = { value: string; label: PhoneLabel | null }
export type ContactEmail = { value: string; label: EmailLabel | null }

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(), // = Supabase Auth UUID (auth.users.id): So no defaultRandom().
    email: text('email').notNull(),
    fullName: text('full_name'),
    jobTitle: text('job_title'),
    avatarUrl: text('avatar_url'),
    tjmReference: integer('tjm_reference').notNull().default(DEFAULT_TJM_REFERENCE),
    plan: planEnum('plan').notNull().default('free'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: 'users_id_auth_fk'
    }).onDelete('cascade')
  ]
)

export const stages = pgTable(
  'stages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('slate'),
    position: integer('position').notNull(),
    systemKey: text('system_key').$type<StageSystemKey>(),
    reminderDelayDays: integer('reminder_delay_days').notNull().default(7),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check(
      'stages_color_token',
      sql`${table.color} in (${sql.raw(STAGE_COLOR_TOKENS.map((t) => `'${t}'`).join(','))})`
    ),
    check(
      'stages_system_key_token',
      sql`${table.systemKey} is null or ${table.systemKey} in (${sql.raw(STAGE_SYSTEM_KEYS.map((k) => `'${k}'`).join(','))})`
    ),
    uniqueIndex('stages_user_system_key_idx')
      .on(table.userId, table.systemKey)
      .where(sql`${table.systemKey} is not null`),
    index('stages_user_position_idx').on(table.userId, table.position)
  ]
)

export const jobTypes = pgTable('job_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const experienceLevels = pgTable('experience_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    firstName: text('first_name'),
    lastName: text('last_name'),
    company: text('company'),
    jobTitle: text('job_title'),
    city: text('city'),
    emails: jsonb('emails')
      .$type<ContactEmail[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    phones: jsonb('phones')
      .$type<ContactPhone[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    linkedinUrl: text('linkedin_url'),
    relationship: text('relationship').$type<ContactRelationship>().notNull().default('other'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check(
      'contacts_relationship_token',
      sql`${table.relationship} in (${sql.raw(CONTACT_RELATIONSHIPS.map((r) => `'${r}'`).join(','))})`
    ),
    check(
      'contacts_identified',
      sql`coalesce(${table.firstName}, ${table.lastName}, ${table.company}) is not null`
    ),
    check(
      'contacts_phones_shape',
      sql`public.contact_entries_valid(${table.phones}, ARRAY[${sql.raw(PHONE_LABELS.map((l) => `'${l}'`).join(','))}])`
    ),
    check(
      'contacts_emails_shape',
      sql`public.contact_entries_valid(${table.emails}, ARRAY[${sql.raw(EMAIL_LABELS.map((l) => `'${l}'`).join(','))}])`
    ),
    index('contacts_user_last_name_idx').on(table.userId, table.lastName, table.firstName),
    index('contacts_user_company_idx').on(table.userId, table.company)
  ]
)

export const opportunityContacts = pgTable(
  'opportunity_contacts',
  {
    opportunityId: uuid('opportunity_id')
      .notNull()
      .references(() => opportunities.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.opportunityId, table.contactId] }),
    check('opportunity_contacts_position_positive', sql`${table.position} >= 0`),
    uniqueIndex('opportunity_contacts_opportunity_position_key').on(
      table.opportunityId,
      table.position
    ),
    index('opportunity_contacts_contact_idx').on(table.contactId)
  ]
)

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'restrict' }),
    jobTypeId: uuid('job_type_id').references(() => jobTypes.id, { onDelete: 'set null' }),
    experienceId: uuid('experience_id').references(() => experienceLevels.id, {
      onDelete: 'set null'
    }),
    esn: text('esn'),
    endClient: text('end_client'),
    need: text('need'),
    dailyRate: integer('daily_rate'),
    onsiteDays: smallint('onsite_days'),
    location: text('location'),
    lastContactAt: date('last_contact_at'),
    nextReminderAt: date('next_reminder_at'),
    offerUrl: text('offer_url'),
    notes: text('notes'),
    isPinned: boolean('is_pinned').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    // One index per sortable column, all prefixed by the lead sort, so a page reads the index
    // instead of sorting the whole filtered set. See docs/reference/server-side-table.md
    index('opportunities_user_pinned_updated_idx').on(
      table.userId,
      table.isPinned.desc(),
      table.updatedAt.desc()
    ),
    index('opportunities_user_pinned_last_contact_idx').on(
      table.userId,
      table.isPinned.desc(),
      table.lastContactAt
    ),
    index('opportunities_user_pinned_daily_rate_idx').on(
      table.userId,
      table.isPinned.desc(),
      table.dailyRate
    ),
    // Joined on every list query; Postgres does not index a foreign key automatically.
    index('opportunities_stage_id_idx').on(table.stageId)
  ]
)

export const usersRelations = relations(users, ({ many }) => ({
  stages: many(stages),
  jobTypes: many(jobTypes),
  experienceLevels: many(experienceLevels),
  opportunities: many(opportunities),
  contacts: many(contacts)
}))

export const stagesRelations = relations(stages, ({ one, many }) => ({
  user: one(users, { fields: [stages.userId], references: [users.id] }),
  opportunities: many(opportunities)
}))

export const jobTypesRelations = relations(jobTypes, ({ one, many }) => ({
  user: one(users, { fields: [jobTypes.userId], references: [users.id] }),
  opportunities: many(opportunities)
}))

export const experienceLevelsRelations = relations(experienceLevels, ({ one, many }) => ({
  user: one(users, { fields: [experienceLevels.userId], references: [users.id] }),
  opportunities: many(opportunities)
}))

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, { fields: [contacts.userId], references: [users.id] }),
  opportunityLinks: many(opportunityContacts)
}))

export const opportunityContactsRelations = relations(opportunityContacts, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityContacts.opportunityId],
    references: [opportunities.id]
  }),
  contact: one(contacts, {
    fields: [opportunityContacts.contactId],
    references: [contacts.id]
  })
}))

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  user: one(users, { fields: [opportunities.userId], references: [users.id] }),
  stage: one(stages, { fields: [opportunities.stageId], references: [stages.id] }),
  jobType: one(jobTypes, { fields: [opportunities.jobTypeId], references: [jobTypes.id] }),
  experience: one(experienceLevels, {
    fields: [opportunities.experienceId],
    references: [experienceLevels.id]
  }),
  contactLinks: many(opportunityContacts)
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Stage = typeof stages.$inferSelect
export type NewStage = typeof stages.$inferInsert
export type JobType = typeof jobTypes.$inferSelect
export type NewJobType = typeof jobTypes.$inferInsert
export type ExperienceLevel = typeof experienceLevels.$inferSelect
export type NewExperienceLevel = typeof experienceLevels.$inferInsert
export type Opportunity = typeof opportunities.$inferSelect
export type NewOpportunity = typeof opportunities.$inferInsert
export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
export type OpportunityContact = typeof opportunityContacts.$inferSelect
