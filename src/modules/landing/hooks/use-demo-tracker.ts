import { useMemo, useState } from 'react'
import type { PaginationState, SortingState } from '@tanstack/react-table'

import { opportunityLabel } from '@/modules/opportunities/utils/display'
import type { OpportunitiesFilters } from '@/modules/opportunities/opportunities-filters'
import { OPPORTUNITIES_SEARCH_DEFAULTS } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow, StatusTab } from '@/modules/opportunities/utils/rows'
import { DEMO_DAILY_RATE_REFERENCE, DEMO_OPPORTUNITY_ROWS } from '@/modules/landing/demo-rows'

// The dashboard filters, sorts and paginates in SQL. The public demo has no server, so the
// same rules are mirrored here — see docs/reference/landing-page.md

function unaccent(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

// Terms AND-ed, columns and contacts OR-ed, both sides unaccented — mirrors searchMatch() in opportunities-sql.ts
function matchesQuery(row: OpportunityRow, query: string) {
  const terms = query.split(/\s+/).filter(Boolean).map(unaccent)
  if (terms.length === 0) return true

  const contacts = row.contacts.map((c) => [c.firstName, c.lastName, c.company].join(' '))
  const haystack = [...contacts, row.esn, row.endClient, row.need, row.location, row.stage?.name]
    .filter((value): value is string => Boolean(value))
    .map(unaccent)

  return terms.every((term) => haystack.some((value) => value.includes(term)))
}

function compare(a: OpportunityRow, b: OpportunityRow, columnId: string) {
  if (columnId === 'stage') {
    return (a.stage?.position ?? 0) - (b.stage?.position ?? 0)
  }
  if (columnId === 'dailyRate') {
    return (a.dailyRate ?? 0) - (b.dailyRate ?? 0)
  }
  if (columnId === 'contact') {
    return opportunityLabel(a).localeCompare(opportunityLabel(b), 'fr')
  }
  if (columnId === 'lastContactAt') {
    return (a.lastContactAt ?? '').localeCompare(b.lastContactAt ?? '')
  }

  const key = columnId as keyof OpportunityRow
  return String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'fr')
}

export function useDemoTracker() {
  const [tab, setTabState] = useState<StatusTab>(OPPORTUNITIES_SEARCH_DEFAULTS.tab)
  const [search, setSearchState] = useState(OPPORTUNITIES_SEARCH_DEFAULTS.q)
  const [isDueOnly, setDueOnlyState] = useState(OPPORTUNITIES_SEARCH_DEFAULTS.due)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: OPPORTUNITIES_SEARCH_DEFAULTS.perPage
  })
  const [pinned, setPinned] = useState<ReadonlySet<string>>(
    () => new Set(DEMO_OPPORTUNITY_ROWS.filter((row) => row.isPinned).map((row) => row.id))
  )
  const [archived, setArchived] = useState<ReadonlySet<string>>(
    () => new Set(DEMO_OPPORTUNITY_ROWS.filter((row) => row.isArchived).map((row) => row.id))
  )
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(() => new Set())

  const query = search.trim()

  // Narrowing the result set invalidates the current page, so it resets in the same update.
  const fromFirstPage = <T>(apply: (value: T) => void) => {
    return (value: T) => {
      apply(value)
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    }
  }

  const allRows = useMemo(
    () =>
      DEMO_OPPORTUNITY_ROWS.filter((row) => !deleted.has(row.id)).map((row) => {
        const isArchived = archived.has(row.id)
        return {
          ...row,
          isPinned: pinned.has(row.id),
          isArchived,
          isArchivedRow: isArchived,
          isDue: row.isDue && !isArchived
        }
      }),
    [pinned, archived, deleted]
  )

  const activeCount = allRows.filter((row) => !row.isArchivedRow).length
  const archivedCount = allRows.length - activeCount

  const filtered = useMemo(() => {
    const inTab = allRows.filter((row) =>
      tab === 'archived' ? row.isArchivedRow : !row.isArchivedRow
    )
    const dueScoped = isDueOnly && tab === 'active' ? inTab.filter((row) => row.isDue) : inTab
    return dueScoped.filter((row) => matchesQuery(row, query))
  }, [allRows, tab, isDueOnly, query])

  const sorted = useMemo(() => {
    const rows = [...filtered]
    const sort = sorting[0]

    rows.sort((a, b) => {
      // Pinned rows lead every sort, exactly as the SQL ordering does.
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (!sort) return (b.lastContactAt ?? '').localeCompare(a.lastContactAt ?? '')
      const result = compare(a, b, sort.id)
      return sort.desc ? -result : result
    })

    return rows
  }, [filtered, sorting])

  const total = sorted.length
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize))
  const servedPage = Math.min(pagination.pageIndex + 1, pageCount)
  const start = (servedPage - 1) * pagination.pageSize
  const rows = sorted.slice(start, start + pagination.pageSize)

  const filters: OpportunitiesFilters = {
    tab,
    view: 'list',
    hiddenFields: [],
    search,
    query,
    isDueOnly,
    hasFilters: query.length > 0 || isDueOnly,
    sorting,
    pagination,
    setTab: fromFirstPage(setTabState),
    setSearch: fromFirstPage(setSearchState),
    setDueOnly: fromFirstPage(setDueOnlyState),
    // The demo stays on the list with every column: the display menu is the dashboard's business.
    setView: () => {},
    toggleField: () => {},
    setSorting,
    setPagination,
    resetFilters: () => {
      setSearchState(OPPORTUNITIES_SEARCH_DEFAULTS.q)
      setDueOnlyState(OPPORTUNITIES_SEARCH_DEFAULTS.due)
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    }
  }

  function toggleIn(set: ReadonlySet<string>, id: string) {
    const next = new Set(set)
    if (!next.delete(id)) next.add(id)
    return next
  }

  return {
    filters,
    rows,
    total,
    servedPage,
    pageCount,
    activeCount,
    archivedCount,
    dueCount: allRows.filter((row) => row.isDue).length,
    dailyRateReference: DEMO_DAILY_RATE_REFERENCE,
    togglePin: (row: OpportunityRow) => setPinned((current) => toggleIn(current, row.id)),
    toggleArchive: (row: OpportunityRow) => setArchived((current) => toggleIn(current, row.id)),
    remove: (row: OpportunityRow) => setDeleted((current) => new Set(current).add(row.id))
  }
}
