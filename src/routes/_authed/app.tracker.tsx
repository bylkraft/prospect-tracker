import { createFileRoute, stripSearchParams, useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  opportunitiesSearchSchema
} from '@/modules/opportunities/opportunities-schema'
import {
  OpportunitiesPanel,
  OpportunitiesPanelSkeleton
} from '@/modules/opportunities/components/opportunities-panel'
import { stagesQueryOptions } from '@/modules/stages/hooks/use-stages'
import { dailyRateReferenceQueryOptions } from '@/modules/customization/hooks/use-daily-rate-reference'
import { jobTypesQueryOptions } from '@/modules/job-types/hooks/use-job-types'
import { experienceLevelsQueryOptions } from '@/modules/experience-levels/hooks/use-experience-levels'
import {
  opportunitiesQueryOptions,
  summaryQueryOptions
} from '@/modules/opportunities/hooks/use-opportunities'
import { stageCountsQueryOptions } from '@/modules/stages/hooks/use-stage-counts'
import {
  toBoardInput,
  toDueOnly,
  toOpportunitiesInput
} from '@/modules/opportunities/utils/search-input'
import { boardQueryOptions } from '@/modules/opportunities/hooks/use-board'
import { getToday } from '@/hooks/use-today'
import { parseHiddenFields } from '@/modules/opportunities/utils/display-settings'

export const Route = createFileRoute('/_authed/app/tracker')({
  ssr: 'data-only',

  validateSearch: opportunitiesSearchSchema,
  search: { middlewares: [stripSearchParams(OPPORTUNITIES_SEARCH_DEFAULTS)] },

  // `hidden` only changes how rows are drawn — see docs/reference/query-prefetching.md
  loaderDeps: ({ search: { hidden: _hidden, ...search } }) => search,

  loader: ({ context: { queryClient }, deps }) => {
    const today = getToday()

    // Only the view on screen: the other one is a full extra query for rows nobody looks at.
    if (deps.view === 'kanban') {
      queryClient.prefetchQuery(boardQueryOptions(toBoardInput(deps, today)))
    } else {
      queryClient.prefetchQuery(opportunitiesQueryOptions(toOpportunitiesInput(deps, today)))
    }

    queryClient.prefetchQuery(summaryQueryOptions(today, deps.q.trim(), toDueOnly(deps)))
    queryClient.prefetchQuery(stageCountsQueryOptions(today))
    queryClient.prefetchQuery(stagesQueryOptions())
    queryClient.prefetchQuery(dailyRateReferenceQueryOptions())
    queryClient.prefetchQuery(jobTypesQueryOptions())
    queryClient.prefetchQuery(experienceLevelsQueryOptions())
  },

  component: Tracker,
  pendingComponent: TrackerPending,
  errorComponent: TrackerError
})

function Tracker() {
  return <OpportunitiesPanel />
}

function TrackerPending() {
  const { view, perPage, hidden } = Route.useSearch()

  return (
    <OpportunitiesPanelSkeleton
      view={view}
      rowCount={perPage}
      hiddenFields={parseHiddenFields(hidden)}
    />
  )
}

function TrackerError() {
  const router = useRouter()

  return (
    <ErrorState description={m.error_dashboardDescription()} onRetry={() => router.invalidate()} />
  )
}
