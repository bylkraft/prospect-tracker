import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, notInArray, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { contacts, opportunities, opportunityContacts, stages } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import {
  contactDetailSchema,
  createContactSchema,
  deleteContactSchema,
  getContactsSchema,
  isIdentified,
  searchContactsSchema,
  updateContactSchema
} from '@/modules/contacts/contacts-schema'
import {
  buildContactsWhere,
  contactDisplayNameSql,
  lastExchange,
  lastLinkedAt,
  lastOpportunityEndClient,
  lastOpportunityEsn,
  lastOpportunityNeed,
  opportunityCount,
  primaryPhone,
  SORT_EXPRESSIONS
} from '@/modules/contacts/contacts-sql'
import { CONTACT_RELATIONSHIPS, type Contact, type ContactRelationship } from '@/db/schema'
import type { PickerContact } from '@/modules/contacts/contacts-types'

const PICKER_RECENT_LIMIT = 3
const PICKER_RESULTS_LIMIT = 8

export type ContactListRow = Contact & {
  opportunityCount: number
  lastExchange: string | null
  lastOpportunity: { need: string | null; esn: string | null; endClient: string | null } | null
}

type ContactsPage = {
  rows: ContactListRow[]
  total: number
  page: number
  pageCount: number
  relationshipCounts: Record<ContactRelationship, number>
  searchTotal: number
}

export const getContacts = createServerFn({ method: 'GET' })
  .validator(getContactsSchema)
  .handler(async ({ data }): Promise<ContactsPage> => {
    const { id: userId } = await requireUser()
    const { sortBy, sortDesc, page, perPage } = data

    const direction = sortDesc ? desc : asc
    const sortExpression = sortBy ? SORT_EXPRESSIONS[sortBy] : null

    const orderBy = [
      ...(sortExpression ? [direction(sortExpression)] : []),
      asc(contactDisplayNameSql),
      asc(contacts.id)
    ]

    const where = buildContactsWhere(userId, data)
    const searchWhere = buildContactsWhere(userId, { ...data, relationship: '' })

    const selectPage = (targetPage: number) =>
      db
        .select({
          contact: contacts,
          opportunityCount: opportunityCount.mapWith(Number),
          lastExchange,
          lastOpportunityNeed,
          lastOpportunityEsn,
          lastOpportunityEndClient
        })
        .from(contacts)
        .where(where)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((targetPage - 1) * perPage)

    const [counted, requestedRows, grouped] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)`.mapWith(Number) })
        .from(contacts)
        .where(where),
      selectPage(page),
      db
        .select({
          relationship: contacts.relationship,
          count: sql<number>`count(*)`.mapWith(Number)
        })
        .from(contacts)
        .where(searchWhere)
        .groupBy(contacts.relationship)
    ])

    const total = counted[0]?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / perPage))
    const servedPage = Math.min(page, pageCount)

    const rows = servedPage === page ? requestedRows : await selectPage(servedPage)

    return {
      rows: rows.map(
        ({ contact, opportunityCount: count, lastExchange: last, ...opportunity }) => ({
          ...contact,
          opportunityCount: count,
          lastExchange: last,
          lastOpportunity:
            count > 0
              ? {
                  need: opportunity.lastOpportunityNeed,
                  esn: opportunity.lastOpportunityEsn,
                  endClient: opportunity.lastOpportunityEndClient
                }
              : null
        })
      ),
      total,
      page: servedPage,
      pageCount,
      relationshipCounts: CONTACT_RELATIONSHIPS.reduce(
        (counts, relationship) => ({
          ...counts,
          [relationship]: grouped.find((row) => row.relationship === relationship)?.count ?? 0
        }),
        {} as Record<ContactRelationship, number>
      ),
      searchTotal: grouped.reduce((sum, row) => sum + row.count, 0)
    }
  })

export type ContactOpportunity = {
  id: string
  need: string | null
  esn: string | null
  endClient: string | null
  dailyRate: number | null
  lastContactAt: string | null
  isArchived: boolean
  stageName: string
  stageColor: string
}

type ContactDetail = {
  contact: Contact
  opportunities: ContactOpportunity[]
}

export const getContact = createServerFn({ method: 'GET' })
  .validator(contactDetailSchema)
  .handler(async ({ data: { id } }): Promise<ContactDetail> => {
    const { id: userId } = await requireUser()

    const contact = await db.query.contacts.findFirst({
      where: (c, { and: all, eq: equals }) => all(equals(c.id, id), equals(c.userId, userId))
    })

    if (!contact) throw appError('NOT_FOUND')

    const rows = await db
      .select({
        id: opportunities.id,
        need: opportunities.need,
        esn: opportunities.esn,
        endClient: opportunities.endClient,
        dailyRate: opportunities.dailyRate,
        lastContactAt: opportunities.lastContactAt,
        isArchived: sql<boolean>`(${opportunities.isArchived} or ${stages.isArchived})`,
        stageName: stages.name,
        stageColor: stages.color
      })
      .from(opportunityContacts)
      .innerJoin(opportunities, eq(opportunities.id, opportunityContacts.opportunityId))
      .innerJoin(stages, eq(stages.id, opportunities.stageId))
      .where(and(eq(opportunityContacts.contactId, id), eq(opportunities.userId, userId)))
      .orderBy(
        desc(opportunities.lastContactAt),
        desc(opportunities.updatedAt),
        asc(opportunities.id)
      )

    return { contact, opportunities: rows }
  })

export const searchContacts = createServerFn({ method: 'GET' })
  .validator(searchContactsSchema)
  .handler(async ({ data: { q, excludeIds } }): Promise<PickerContact[]> => {
    const { id: userId } = await requireUser()

    const orderBy = q
      ? [asc(contactDisplayNameSql)]
      : [sql`${lastLinkedAt} desc nulls last`, desc(contacts.createdAt)]

    return db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        company: contacts.company,
        jobTitle: contacts.jobTitle,
        relationship: contacts.relationship,
        phone: primaryPhone,
        opportunityCount: opportunityCount.mapWith(Number),
        lastLinkedAt: sql<string | null>`${lastLinkedAt}::text`
      })
      .from(contacts)
      .where(
        and(
          buildContactsWhere(userId, { q, relationship: '' }),
          excludeIds.length > 0 ? notInArray(contacts.id, excludeIds) : undefined
        )
      )
      .orderBy(...orderBy, asc(contacts.id))
      .limit(q ? PICKER_RESULTS_LIMIT : PICKER_RECENT_LIMIT)
  })

export const createContact = createServerFn({ method: 'POST' })
  .validator(createContactSchema)
  .handler(async ({ data }): Promise<Contact> => {
    const { id: userId } = await requireUser()

    const [created] = await db
      .insert(contacts)
      .values({ ...data, userId })
      .returning()

    if (!created) throw appError('SERVER')

    return created
  })

export const updateContact = createServerFn({ method: 'POST' })
  .validator(updateContactSchema)
  .handler(async ({ data: { id, ...fields } }): Promise<Contact> => {
    const { id: userId } = await requireUser()

    return db.transaction(async (tx) => {
      // Drizzle bypasses RLS — see docs/reference/data-access-security.md
      const [current] = await tx
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))

      if (!current) throw appError('NOT_FOUND')

      // Decided on the merged row: a patch alone cannot tell — see docs/reference/contacts.md
      if (!isIdentified({ ...current, ...fields })) throw appError('CONTACT_IDENTITY_REQUIRED')

      const [updated] = await tx
        .update(contacts)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
        .returning()

      if (!updated) throw appError('NOT_FOUND')

      return updated
    })
  })

export const deleteContact = createServerFn({ method: 'POST' })
  .validator(deleteContactSchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [deleted] = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning({ id: contacts.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })
