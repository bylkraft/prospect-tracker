import { and, eq, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'

import {
  contacts,
  opportunities,
  opportunityContacts,
  stages,
  STAGE_SYSTEM_KEY,
  TERMINAL_STAGE_KEYS,
  type StageSystemKey
} from '@/db/schema'
import { contactDisplayNameSql } from '@/modules/contacts/contacts-sql'
import type {
  GetOpportunitiesInput,
  SortColumn,
  UpdateOpportunityInput
} from '@/modules/opportunities/opportunities-schema'

// A row is archived by its own flag or by sitting in an archived stage.
export const isArchivedRow = sql`(${opportunities.isArchived} or ${stages.isArchived})`

// A rejection is an answer; reaching an interview or a proposal proves one came. Ghosté is
// the absence of one, so it is contacted-but-silent — see docs/reference/kpis.md
const REPLIED: readonly StageSystemKey[] = [
  STAGE_SYSTEM_KEY.INTERVIEW,
  STAGE_SYSTEM_KEY.OFFER,
  STAGE_SYSTEM_KEY.REJECTED
]

// An outcome, not a step — nothing is owed to an opportunity already rejected or ghosted.
export const isTerminal = sql`((${stages.systemKey} in ${TERMINAL_STAGE_KEYS}) is true)`

export const inInterview = sql`${stages.systemKey} = ${STAGE_SYSTEM_KEY.INTERVIEW}`
// Free stages are neutral on both sides of the ratio, so the denominator takes system stages
// only — an opportunity parked in one has already passed through the seeded ones anyway.
// See docs/reference/kpis.md
export const isContacted = sql`(${stages.systemKey} is not null and ${stages.systemKey} <> ${STAGE_SYSTEM_KEY.SAVED})`
export const hasReplied = sql`((${stages.systemKey} in ${REPLIED}) is true)`
export const awaitingReply = sql`not ${hasReplied}`

const dueDate = sql`coalesce(
  ${opportunities.nextReminderAt},
  ${opportunities.lastContactAt} + ${stages.reminderDelayDays}
)`

// The single definition of "due for follow-up" — the client reads this, it never recomputes.
// See docs/reference/data-model.md
export const isDueExpression = (today: string) =>
  sql<boolean>`(
    not ${isArchivedRow}
    and not ${isTerminal}
    and ${dueDate} is not null
    and ${dueDate} <= ${today}::date
  )`

// Disjoint from isDueExpression by construction — it negates that same expression, so a row can
// never land in both, and one leaving the due side lands here instead of vanishing from the day's
// total. Archived rows stay out of both. Excludes rows created today. See docs/reference/kpis.md
export const isDoneTodayExpression = (today: string) =>
  sql<boolean>`(
    not ${isArchivedRow}
    and ${opportunities.lastContactAt} = ${today}::date
    and ${opportunities.createdAt} < ${today}::date
    and not ${isDueExpression(today)}
  )`

const primaryContactName = sql`(
  select ${contactDisplayNameSql}
  from ${opportunityContacts}
  join ${contacts} on ${contacts.id} = ${opportunityContacts.contactId}
  where ${opportunityContacts.opportunityId} = ${opportunities.id}
  order by ${opportunityContacts.position}
  limit 1
)`

export const SORT_EXPRESSIONS: Record<SortColumn, SQL | AnyColumn> = {
  lastContactAt: opportunities.lastContactAt,
  contact: primaryContactName,
  esn: opportunities.esn,
  endClient: opportunities.endClient,
  dailyRate: opportunities.dailyRate,
  location: opportunities.location,
  stage: stages.name
}

const SEARCH_COLUMNS = [
  opportunities.esn,
  opportunities.endClient,
  opportunities.need,
  opportunities.location,
  stages.name
]

const matchesSomeContact = (term: string) => sql`exists (
  select 1 from ${opportunityContacts}
  join ${contacts} on ${contacts.id} = ${opportunityContacts.contactId}
  where ${opportunityContacts.opportunityId} = ${opportunities.id}
    and immutable_unaccent(concat_ws(' ', ${contacts.firstName}, ${contacts.lastName}, ${contacts.company}))
        ilike immutable_unaccent(${'%' + term + '%'})
)`

// Terms AND-ed, columns OR-ed, both sides unaccented — see docs/reference/server-side-table.md
export function searchMatch(q: string) {
  const terms = q.split(/\s+/).filter(Boolean)
  if (terms.length === 0) return null

  const matchesSomeColumn = (term: string) =>
    or(
      // Unaccenting the column, not just the term, is what keeps the expression indexes in play.
      ...SEARCH_COLUMNS.map(
        (column) => sql`immutable_unaccent(${column}) ilike immutable_unaccent(${`%${term}%`})`
      ),
      matchesSomeContact(term)
    )

  return and(...terms.map(matchesSomeColumn)) ?? null
}

type RowFilters = Pick<GetOpportunitiesInput, 'tab' | 'q' | 'due' | 'today'>

export function buildWhere(userId: string, { tab, q, due, today }: RowFilters) {
  const filters: SQL[] = [eq(opportunities.userId, userId)]

  filters.push(tab === 'archived' ? sql`${isArchivedRow}` : sql`not ${isArchivedRow}`)

  const match = searchMatch(q)
  if (match) filters.push(match)

  if (due) filters.push(isDueExpression(today))

  return and(...filters)
}

// Logging a contact past a forced reminder pushes that reminder to the stage's next slot rather
// than leaving the row stuck in the due list — see docs/reference/data-model.md
export function rescheduledReminder(fields: Partial<UpdateOpportunityInput>) {
  if (!fields.lastContactAt) return {}

  // The reminder this write lands on: what the form submitted, or the stored one when the field
  // was left alone. Reading the column here would compare against the value being replaced.
  const target =
    fields.nextReminderAt === undefined
      ? sql`${opportunities.nextReminderAt}`
      : sql`${fields.nextReminderAt}::date`

  // The stage this write lands on, for the same reason as the reminder above.
  const targetStage = fields.stageId ? sql`${fields.stageId}::uuid` : sql`${opportunities.stageId}`

  return {
    nextReminderAt: sql`case
      when ${target} is null or ${target} > ${fields.lastContactAt}::date
      then ${target}
      else ${fields.lastContactAt}::date + (
        select ${stages.reminderDelayDays} from ${stages}
        where ${stages.id} = ${targetStage}
      )
    end`
  }
}
