import type { PaginationState, SortingState } from '@tanstack/react-table'

import type { HidableField, View } from '@/modules/opportunities/utils/display-settings'
import type { StatusTab } from '@/modules/opportunities/utils/rows'

/**
 * The filter state the table and toolbar render from, injected rather than read.
 * The dashboard backs it with the URL; the public demo backs it with local state.
 * See docs/reference/server-side-table.md
 */
export type OpportunitiesFilters = {
  tab: StatusTab
  view: View
  hiddenFields: readonly HidableField[]
  search: string
  query: string
  isDueOnly: boolean
  hasFilters: boolean
  sorting: SortingState
  pagination: PaginationState
  setTab: (tab: StatusTab) => void
  setSearch: (q: string) => void
  setDueOnly: (due: boolean) => void
  setView: (view: View) => void
  toggleField: (field: HidableField) => void
  setSorting: (next: SortingState) => void
  setPagination: (next: PaginationState) => void
  resetFilters: () => void
}
