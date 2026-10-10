import { QueryGate } from '@/components/query-gate'
import { useToday } from '@/hooks/use-today'
import { OpportunitiesBoard } from '@/modules/opportunities/components/opportunities-board'
import { OpportunitiesContentSkeleton } from '@/modules/opportunities/components/opportunities-content-skeleton'
import { OpportunitiesToolbar } from '@/modules/opportunities/components/opportunities-toolbar'
import { useOpportunityEditorContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import { useBoard } from '@/modules/opportunities/hooks/use-board'
import { useBoardInput } from '@/modules/opportunities/hooks/use-board-input'
import { useBoardUpdate } from '@/modules/opportunities/hooks/use-board-update'
import { toRows } from '@/modules/opportunities/utils/rows'
import { indexStages } from '@/modules/stages/stages-utils'
import type { useDailyRateReference } from '@/modules/customization/hooks/use-daily-rate-reference'
import type { useOpportunitiesSummary } from '@/modules/opportunities/hooks/use-opportunities'
import type { useStages } from '@/modules/stages/hooks/use-stages'
import type { HidableField } from '@/modules/opportunities/utils/display-settings'

type Props = {
  hiddenFields: readonly HidableField[]
  summaryQuery: ReturnType<typeof useOpportunitiesSummary>
  stagesQuery: ReturnType<typeof useStages>
  dailyRateQuery: ReturnType<typeof useDailyRateReference>
  emptyTitle: string
  emptyHint: string
}

export function OpportunitiesBoardView({
  hiddenFields,
  summaryQuery,
  stagesQuery,
  dailyRateQuery,
  emptyTitle,
  emptyHint
}: Props) {
  const today = useToday()
  const input = useBoardInput()
  const boardQuery = useBoard(input)
  const update = useBoardUpdate(input, stagesQuery.data ?? [])
  const editor = useOpportunityEditorContext()

  return (
    <QueryGate
      queries={[summaryQuery, boardQuery, stagesQuery, dailyRateQuery]}
      skeleton={
        <OpportunitiesContentSkeleton view="kanban" rowCount={0} hiddenFields={hiddenFields} />
      }
    >
      {([summary, board, stages, dailyRate]) => (
        <>
          <OpportunitiesToolbar
            activeCount={summary.activeCount}
            archivedCount={summary.archivedCount}
          />
          <OpportunitiesBoard
            rows={toRows(board.rows, indexStages(stages))}
            stages={stages}
            today={today}
            hiddenFields={hiddenFields}
            dailyRateReference={dailyRate.dailyRateReference}
            // Dimmed for a filter change only — see docs/reference/kanban-view.md
            isStale={boardQuery.isPlaceholderData}
            isTruncated={board.isTruncated}
            total={board.total}
            onOpen={editor.openEdit}
            onTogglePin={update.togglePin}
            onMove={update.move}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
          />
        </>
      )}
    </QueryGate>
  )
}
