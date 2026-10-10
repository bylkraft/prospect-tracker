import { useNavigate, useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.tracker'
import { useTableSearch } from '@/shared/table/hooks/use-table-search'
import { toDueOnly } from '@/modules/opportunities/utils/search-input'
import {
  parseHiddenFields,
  serializeHiddenFields,
  toggleHiddenField,
  type HidableField,
  type View
} from '@/modules/opportunities/utils/display-settings'
import {
  rememberTrackerDisplay,
  withDisplay
} from '@/modules/opportunities/utils/display-preferences'
import type { StatusTab } from '@/modules/opportunities/utils/rows'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  type OpportunitiesSearch
} from '@/modules/opportunities/opportunities-schema'

export function useOpportunitiesFilters() {
  const search = useSearch({ from: Route.id })
  const navigate = useNavigate({ from: Route.fullPath })

  const { sorting, pagination, setSearchFromFirstPage, setSorting, setPagination } =
    useTableSearch<OpportunitiesSearch>({
      search,
      onSearchChange: (patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true })
      },
      firstPage: OPPORTUNITIES_SEARCH_DEFAULTS.page
    })

  const isDueOnly = toDueOnly(search)

  // Raw in the URL, normalised for every consumer — see docs/reference/server-side-table.md
  const query = search.q.trim()

  const hiddenFields = parseHiddenFields(search.hidden)

  return {
    tab: search.tab,
    view: search.view,
    hiddenFields,
    search: search.q,
    query,
    isDueOnly,
    hasFilters: query.length > 0 || isDueOnly,
    sorting,
    pagination,
    setTab: (tab: StatusTab) => setSearchFromFirstPage({ tab }),
    setSearch: (q: string) => setSearchFromFirstPage({ q }),
    setDueOnly: (due: boolean) => setSearchFromFirstPage({ due }),

    // Neither is a filter, so neither resets the page: they change how the rows are drawn. Both are
    // remembered for the next visit — see docs/reference/ui-preferences.md
    setView: (view: View) => {
      void navigate({
        search: (previous) => {
          const display = { view, hidden: previous.hidden }
          rememberTrackerDisplay(display)
          return withDisplay(previous, display)
        },
        replace: true
      })
    },
    // From `previous`, not the render's `hiddenFields`: two toggles before a re-render would
    // otherwise both start from the same list, and the second would undo the first.
    toggleField: (field: HidableField) => {
      void navigate({
        search: (previous) => {
          const hidden = toggleHiddenField(parseHiddenFields(previous.hidden), field)
          const display = { view: previous.view, hidden: serializeHiddenFields(hidden) }
          rememberTrackerDisplay(display)
          return withDisplay(previous, display)
        },
        replace: true
      })
    },
    setSorting,
    setPagination,
    resetFilters: () =>
      setSearchFromFirstPage({
        q: OPPORTUNITIES_SEARCH_DEFAULTS.q,
        due: OPPORTUNITIES_SEARCH_DEFAULTS.due
      })
  }
}
