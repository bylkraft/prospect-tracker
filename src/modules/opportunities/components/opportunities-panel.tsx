import { ErrorState } from '@/components/error-state'
import { QueryGate } from '@/components/query-gate'
import { m } from '@/i18n/paraglide/messages'
import { KpiBand, KpiBandSkeleton } from '@/modules/opportunities/components/kpi-band'
import {
  OpportunitiesTable,
  OPPORTUNITIES_COLUMN_IDS,
  OPPORTUNITIES_GRID_TEMPLATE,
  OPPORTUNITIES_SILENT_COLUMN_ID
} from '@/modules/opportunities/components/opportunities-table'
import { DataTableSkeleton } from '@/shared/table/components/data-table-skeleton'
import {
  OpportunitiesToolbar,
  OpportunitiesToolbarSkeleton
} from '@/modules/opportunities/components/opportunities-toolbar'
import {
  useOpportunities,
  useOpportunitiesSummary
} from '@/modules/opportunities/hooks/use-opportunities'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { useOpportunitiesInput } from '@/modules/opportunities/hooks/use-opportunities-input'
import { useOpportunityEditorContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import { toRows } from '@/modules/opportunities/utils/rows'
import { indexStages } from '@/modules/stages/stages-utils'
import { useStages } from '@/modules/stages/hooks/use-stages'
import { useDailyRateReference } from '@/modules/customization/hooks/use-daily-rate-reference'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col'
const PANEL_CARD_LAYOUT =
  'bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'

export function OpportunitiesPanel() {
  const input = useOpportunitiesInput()
  const { hasFilters, pagination, query, isDueOnly } = useOpportunitiesFilters()

  const stagesQuery = useStages()
  const dailyRateQuery = useDailyRateReference()
  const pageQuery = useOpportunities(input)
  const summaryQuery = useOpportunitiesSummary(query, isDueOnly)

  const editor = useOpportunityEditorContext()

  if (summaryQuery.isError) {
    return <ErrorState variant="slot" onRetry={() => void summaryQuery.refetch()} />
  }

  return (
    <div className={PANEL_LAYOUT}>
      <QueryGate queries={[summaryQuery]} skeleton={<KpiBandSkeleton />}>
        {([summary]) => <KpiBand kpis={summary.kpis} />}
      </QueryGate>

      <div className={PANEL_CARD_LAYOUT}>
        <QueryGate
          queries={[summaryQuery, pageQuery, stagesQuery, dailyRateQuery]}
          skeleton={<OpportunitiesTableSkeleton rowCount={pagination.pageSize} />}
        >
          {([summary, page, stages, dailyRate]) => (
            <>
              <OpportunitiesToolbar
                activeCount={summary.activeCount}
                archivedCount={summary.archivedCount}
              />
              <OpportunitiesTable
                rows={toRows(page.rows, indexStages(stages))}
                total={page.total}
                servedPage={page.page}
                pageCount={page.pageCount}
                isFetching={pageQuery.isFetching}
                onTogglePin={editor.togglePin}
                onEdit={editor.openEdit}
                onToggleArchive={editor.toggleArchive}
                onDelete={editor.requestDelete}
                dailyRateReference={dailyRate.dailyRateReference}
                emptyTitle={hasFilters ? m.table_noResults() : m.table_empty()}
                emptyHint={hasFilters ? m.table_noResultsHint() : m.table_emptyHint()}
              />
            </>
          )}
        </QueryGate>
      </div>
    </div>
  )
}

function OpportunitiesTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      <OpportunitiesToolbarSkeleton />
      <DataTableSkeleton
        gridTemplate={OPPORTUNITIES_GRID_TEMPLATE}
        columnIds={OPPORTUNITIES_COLUMN_IDS}
        rowCount={rowCount}
        silentColumnId={OPPORTUNITIES_SILENT_COLUMN_ID}
      />
    </>
  )
}

export function OpportunitiesPanelSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div className={PANEL_LAYOUT}>
      <KpiBandSkeleton />
      <div className={PANEL_CARD_LAYOUT}>
        <OpportunitiesTableSkeleton rowCount={rowCount} />
      </div>
    </div>
  )
}
