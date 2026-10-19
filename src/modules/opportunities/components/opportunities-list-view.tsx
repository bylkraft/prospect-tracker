import { QueryGate } from '@/components/query-gate'
import { OpportunitiesContentSkeleton } from '@/modules/opportunities/components/opportunities-content-skeleton'
import { OpportunitiesTable } from '@/modules/opportunities/components/opportunities-table'
import { OpportunitiesToolbar } from '@/modules/opportunities/components/opportunities-toolbar'
import { useOpportunityEditorContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import {
  useOpportunities,
  type useOpportunitiesSummary
} from '@/modules/opportunities/hooks/use-opportunities'
import { useOpportunitiesInput } from '@/modules/opportunities/hooks/use-opportunities-input'
import { toRows } from '@/modules/opportunities/utils/rows'
import { indexStages } from '@/modules/stages/stages-utils'
import type { useDailyRateReference } from '@/modules/customization/hooks/use-daily-rate-reference'
import type { useStages } from '@/modules/stages/hooks/use-stages'
import type { HidableField } from '@/modules/opportunities/utils/display-settings'
import type { OpportunitiesFilters } from '@/modules/opportunities/opportunities-filters'

type Props = {
  filters: OpportunitiesFilters
  hiddenFields: readonly HidableField[]
  summaryQuery: ReturnType<typeof useOpportunitiesSummary>
  stagesQuery: ReturnType<typeof useStages>
  dailyRateQuery: ReturnType<typeof useDailyRateReference>
  pageSize: number
  emptyTitle: string
  emptyHint: string
}

export function OpportunitiesListView({
  filters,
  hiddenFields,
  summaryQuery,
  stagesQuery,
  dailyRateQuery,
  pageSize,
  emptyTitle,
  emptyHint
}: Props) {
  const input = useOpportunitiesInput()
  const pageQuery = useOpportunities(input)
  const editor = useOpportunityEditorContext()

  return (
    <QueryGate
      queries={[summaryQuery, pageQuery, stagesQuery, dailyRateQuery]}
      skeleton={
        <OpportunitiesContentSkeleton view="list" rowCount={pageSize} hiddenFields={hiddenFields} />
      }
    >
      {([summary, page, stages, dailyRate]) => (
        <>
          <OpportunitiesToolbar
            activeCount={summary.activeCount}
            archivedCount={summary.archivedCount}
            filters={filters}
          />
          <OpportunitiesTable
            rows={toRows(page.rows, indexStages(stages))}
            filters={filters}
            total={page.total}
            servedPage={page.page}
            pageCount={page.pageCount}
            isFetching={pageQuery.isFetching}
            onTogglePin={editor.togglePin}
            onEdit={editor.openEdit}
            onToggleArchive={editor.toggleArchive}
            onDelete={editor.requestDelete}
            dailyRateReference={dailyRate.dailyRateReference}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
          />
        </>
      )}
    </QueryGate>
  )
}
