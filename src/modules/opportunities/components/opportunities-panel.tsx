import { ErrorState } from '@/components/error-state'
import { QueryGate } from '@/components/query-gate'
import { m } from '@/i18n/paraglide/messages'
import { KpiBand, KpiBandSkeleton } from '@/modules/opportunities/components/kpi-band'
import { OpportunitiesBoardView } from '@/modules/opportunities/components/opportunities-board-view'
import { OpportunitiesContentSkeleton } from '@/modules/opportunities/components/opportunities-content-skeleton'
import { OpportunitiesListView } from '@/modules/opportunities/components/opportunities-list-view'
import { useOpportunitiesSummary } from '@/modules/opportunities/hooks/use-opportunities'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { useStages } from '@/modules/stages/hooks/use-stages'
import { useDailyRateReference } from '@/modules/customization/hooks/use-daily-rate-reference'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col'
const PANEL_CARD_LAYOUT =
  'bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'

export function OpportunitiesPanel() {
  const { hasFilters, pagination, query, isDueOnly, view, hiddenFields } = useOpportunitiesFilters()

  const stagesQuery = useStages()
  const dailyRateQuery = useDailyRateReference()
  const summaryQuery = useOpportunitiesSummary(query, isDueOnly)

  const emptyTitle = hasFilters ? m.table_noResults() : m.table_empty()
  const emptyHint = hasFilters ? m.table_noResultsHint() : m.table_emptyHint()

  if (summaryQuery.isError) {
    return <ErrorState variant="slot" onRetry={() => void summaryQuery.refetch()} />
  }

  const shared = { hiddenFields, summaryQuery, stagesQuery, dailyRateQuery, emptyTitle, emptyHint }

  return (
    <div className={PANEL_LAYOUT}>
      <QueryGate queries={[summaryQuery]} skeleton={<KpiBandSkeleton />}>
        {([summary]) => <KpiBand kpis={summary.kpis} />}
      </QueryGate>

      <div className={PANEL_CARD_LAYOUT}>
        {view === 'kanban' ? (
          <OpportunitiesBoardView {...shared} />
        ) : (
          <OpportunitiesListView {...shared} pageSize={pagination.pageSize} />
        )}
      </div>
    </div>
  )
}

export function OpportunitiesPanelSkeleton(
  props: React.ComponentProps<typeof OpportunitiesContentSkeleton>
) {
  return (
    <div className={PANEL_LAYOUT}>
      <KpiBandSkeleton />
      <div className={PANEL_CARD_LAYOUT}>
        <OpportunitiesContentSkeleton {...props} />
      </div>
    </div>
  )
}
