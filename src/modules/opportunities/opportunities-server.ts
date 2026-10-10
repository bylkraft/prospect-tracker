import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'

import { db } from '@/db/client'
import { contacts, opportunities, opportunityContacts, stages } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import {
  createOpportunitySchema,
  deleteOpportunitySchema,
  getBoardSchema,
  getOpportunitiesSchema,
  opportunitiesSummarySchema,
  updateOpportunitySchema,
  BOARD_ROW_LIMIT,
  STALE_THRESHOLD_DAYS
} from '@/modules/opportunities/opportunities-schema'
import {
  awaitingReply,
  buildWhere,
  hasReplied,
  inInterview,
  isContacted,
  isTerminal,
  rescheduledReminder,
  isArchivedRow,
  isDueExpression,
  searchMatch,
  SORT_EXPRESSIONS
} from '@/modules/opportunities/opportunities-sql'
import { primaryPhone } from '@/modules/contacts/contacts-sql'
import type { LinkedContact } from '@/modules/contacts/contacts-types'
import type { OpportunityDueFlags } from '@/modules/opportunities/utils/rows'

type OpportunitiesPage = {
  rows: OpportunityDueFlags[]
  total: number
  page: number
  pageCount: number
}

// The table and the board read the same rows under the same filters; each orders and cuts them.
function selectRows(where: SQL | undefined, today: string) {
  return db
    .select({
      opportunity: opportunities,
      isDue: isDueExpression(today),
      isArchivedRow: sql<boolean>`${isArchivedRow}`
    })
    .from(opportunities)
    .innerJoin(stages, eq(stages.id, opportunities.stageId))
    .where(where)
}

async function countRows(where: SQL | undefined) {
  const [counted] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(opportunities)
    .innerJoin(stages, eq(stages.id, opportunities.stageId))
    .where(where)

  return counted?.total ?? 0
}

async function withContacts(
  rows: Awaited<ReturnType<typeof selectRows>>
): Promise<OpportunityDueFlags[]> {
  const links = await listContactsFor(rows.map(({ opportunity }) => opportunity.id))

  return rows.map(({ opportunity, isDue, isArchivedRow }) => ({
    ...opportunity,
    isDue,
    isArchivedRow,
    contacts: links.get(opportunity.id) ?? []
  }))
}

export const getOpportunities = createServerFn({ method: 'GET' })
  .validator(getOpportunitiesSchema)
  .handler(async ({ data }): Promise<OpportunitiesPage> => {
    const { id: userId } = await requireUser()
    const { sortBy, sortDesc, page, perPage } = data

    const sortExpression = sortBy ? SORT_EXPRESSIONS[sortBy] : null
    const direction = sortDesc ? desc : asc

    const orderBy = [
      // Pinning is a permanent lead sort, so pinned rows stay on top of any column sort.
      desc(opportunities.isPinned),
      ...(sortExpression ? [direction(sortExpression)] : []),
      desc(opportunities.updatedAt),
      // Seeded and bulk-updated rows share timestamps; without a unique key last, ties reshuffle
      // between requests and a row can show up on two pages or none.
      asc(opportunities.id)
    ]

    const where = buildWhere(userId, data)

    const selectPage = (targetPage: number) =>
      selectRows(where, data.today)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((targetPage - 1) * perPage)

    // Two queries beat one `count(*) over()` — see docs/reference/server-side-table.md
    const [total, requestedRows] = await Promise.all([countRows(where), selectPage(page)])

    const pageCount = Math.max(1, Math.ceil(total / perPage))
    const servedPage = Math.min(page, pageCount)

    // Only an out-of-range `?page=` pays for a second round trip.
    const rows = servedPage === page ? requestedRows : await selectPage(servedPage)

    return {
      rows: await withContacts(rows),
      total,
      page: servedPage,
      pageCount
    }
  })

export type Board = {
  rows: OpportunityDueFlags[]
  total: number
  // The board is capped, so it has to say when it is showing less than it counted.
  isTruncated: boolean
}

// One flat list, grouped by stage on the client — see docs/reference/kanban-view.md
export const getBoard = createServerFn({ method: 'GET' })
  .validator(getBoardSchema)
  .handler(async ({ data }): Promise<Board> => {
    const { id: userId } = await requireUser()

    const where = buildWhere(userId, data)

    const [total, rows] = await Promise.all([
      countRows(where),
      selectRows(where, data.today)
        // Pinned first, then recency, like the list — see docs/reference/kanban-view.md
        .orderBy(desc(opportunities.isPinned), desc(opportunities.updatedAt), asc(opportunities.id))
        .limit(BOARD_ROW_LIMIT)
    ])

    return { rows: await withContacts(rows), total, isTruncated: total > rows.length }
  })

async function listContactsFor(opportunityIds: string[]) {
  const byOpportunity = new Map<string, LinkedContact[]>()
  if (opportunityIds.length === 0) return byOpportunity

  const rows = await db
    .select({
      opportunityId: opportunityContacts.opportunityId,
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      company: contacts.company,
      jobTitle: contacts.jobTitle,
      relationship: contacts.relationship,
      phone: primaryPhone
    })
    .from(opportunityContacts)
    .innerJoin(contacts, eq(contacts.id, opportunityContacts.contactId))
    .where(inArray(opportunityContacts.opportunityId, opportunityIds))
    .orderBy(asc(opportunityContacts.position))

  for (const { opportunityId, ...contact } of rows) {
    const list = byOpportunity.get(opportunityId)
    if (list) list.push(contact)
    else byOpportunity.set(opportunityId, [contact])
  }

  return byOpportunity
}

async function writeContactLinks(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  opportunityId: string,
  contactIds: string[]
) {
  if (contactIds.length > 0) {
    // Drizzle bypasses RLS — see docs/reference/data-access-security.md
    const owned = await tx
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)))

    if (owned.length !== new Set(contactIds).size) throw appError('NOT_FOUND')
  }

  await tx.delete(opportunityContacts).where(eq(opportunityContacts.opportunityId, opportunityId))

  if (contactIds.length > 0) {
    await tx
      .insert(opportunityContacts)
      .values(contactIds.map((contactId, position) => ({ opportunityId, contactId, position })))
  }
}

export type Kpis = {
  dueToday: number
  stale: number
  interviews: number
  responseRate: number | null
}

type OpportunitiesSummary = {
  kpis: Kpis
  activeCount: number
  archivedCount: number
}

// Aggregates span every row, not the current page. See docs/reference/kpis.md
export const getOpportunitiesSummary = createServerFn({ method: 'GET' })
  .validator(opportunitiesSummarySchema)
  .handler(async ({ data: { today, q, due } }): Promise<OpportunitiesSummary> => {
    const { id: userId } = await requireUser()

    const isDue = isDueExpression(today)

    const match = searchMatch(q)
    // Tab counts carry every active filter — see docs/reference/kpis.md
    const matches = and(match ?? sql`true`, due ? isDue : sql`true`)

    const [row] = await db
      .select({
        dueToday: sql<number>`count(*) filter (where ${isDue})`.mapWith(Number),
        stale: sql<number>`count(*) filter (
          where not ${isArchivedRow}
            and not ${isTerminal}
            and ${isContacted}
            and ${awaitingReply}
            and ${opportunities.lastContactAt} is not null
            and (${today}::date - ${opportunities.lastContactAt}) > ${STALE_THRESHOLD_DAYS}
        )`.mapWith(Number),
        interviews: sql<number>`count(*) filter (
          where not ${isArchivedRow} and ${inInterview}
        )`.mapWith(Number),
        contacted: sql<number>`count(*) filter (
          where ${isContacted}
        )`.mapWith(Number),
        replied: sql<number>`count(*) filter (
          where ${isContacted} and ${hasReplied}
        )`.mapWith(Number),
        activeCount: sql<number>`count(*) filter (
          where not ${isArchivedRow} and ${matches}
        )`.mapWith(Number),
        archivedCount: sql<number>`count(*) filter (
          where ${isArchivedRow} and ${matches}
        )`.mapWith(Number)
      })
      .from(opportunities)
      .innerJoin(stages, eq(stages.id, opportunities.stageId))
      .where(eq(opportunities.userId, userId))

    const contacted = row?.contacted ?? 0

    return {
      kpis: {
        dueToday: row?.dueToday ?? 0,
        stale: row?.stale ?? 0,
        interviews: row?.interviews ?? 0,
        responseRate: contacted === 0 ? null : Math.round(((row?.replied ?? 0) / contacted) * 100)
      },
      activeCount: row?.activeCount ?? 0,
      archivedCount: row?.archivedCount ?? 0
    }
  })

export const createOpportunity = createServerFn({ method: 'POST' })
  .validator(createOpportunitySchema)
  .handler(async ({ data: { contactIds, ...fields } }) => {
    const { id: userId } = await requireUser()

    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(opportunities)
        .values({ ...fields, userId })
        .returning()

      if (!created) throw appError('SERVER')

      if (contactIds) await writeContactLinks(tx, userId, created.id, contactIds)

      return created
    })
  })

export const updateOpportunity = createServerFn({ method: 'POST' })
  .validator(updateOpportunitySchema)
  .handler(async ({ data: { id, contactIds, ...fields } }) => {
    const { id: userId } = await requireUser()

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(opportunities)
        .set({ ...fields, ...rescheduledReminder(fields), updatedAt: new Date() })
        .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
        .returning()

      if (!updated) throw appError('NOT_FOUND')

      // Undefined leaves the links alone: a pin toggle must not unlink every contact.
      if (contactIds) await writeContactLinks(tx, userId, id, contactIds)

      return updated
    })
  })

export const deleteOpportunity = createServerFn({ method: 'POST' })
  .validator(deleteOpportunitySchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [deleted] = await db
      .delete(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
      .returning({ id: opportunities.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })
