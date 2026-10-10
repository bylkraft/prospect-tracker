import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { OpportunitiesBoardColumn } from '@/modules/opportunities/components/opportunities-board-column'
import { BOARD_ID, toColumns } from '@/modules/opportunities/utils/board'
import { opportunityLabel } from '@/modules/opportunities/utils/display'
import { BOARD_LAYOUT } from '@/shared/board/components/board-layout'
import { BoardNotice } from '@/shared/board/components/board-notice'
import { LiveRegion } from '@/shared/sortable/components/live-region'
import { useBoardDnd } from '@/shared/board/hooks/use-board-dnd'
import { useMoveAnnouncer } from '@/shared/board/hooks/use-move-announcer'
import type { Stage } from '@/db/schema'
import type { HidableField } from '@/modules/opportunities/utils/display-settings'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Props = {
  rows: OpportunityRow[]
  stages: Stage[]
  today: string
  hiddenFields: readonly HidableField[]
  dailyRateReference: number
  isStale: boolean
  isTruncated: boolean
  total: number
  onOpen: (row: OpportunityRow) => void
  onTogglePin: (row: OpportunityRow) => void
  onMove: (row: OpportunityRow, stageId: string) => void
  emptyTitle: string
  emptyHint: string
}

export function OpportunitiesBoard({
  rows,
  stages,
  today,
  hiddenFields,
  dailyRateReference,
  isStale,
  isTruncated,
  total,
  onOpen,
  onTogglePin,
  onMove,
  emptyTitle,
  emptyHint
}: Props) {
  const columns = toColumns(rows, stages)
  const byId = new Map(rows.map((row) => [row.id, row]))

  const move = (cardId: string, toColumnId: string) => {
    const row = byId.get(cardId)
    if (row) onMove(row, toColumnId)
  }

  const { message, commitMove } = useMoveAnnouncer({
    cardName: (cardId) => {
      const row = byId.get(cardId)
      return row && opportunityLabel(row)
    },
    columnName: (columnId) => stages.find((stage) => stage.id === columnId)?.name,
    commit: move
  })

  const { rowRef } = useBoardDnd({ boardId: BOARD_ID, onMove: commitMove })

  // Mounted above the empty states: the move that empties the board must still be announced.
  const content =
    columns.length === 0 ? (
      <BoardNotice title={m.board_noStages()} hint={m.board_noStagesHint()} />
    ) : rows.length === 0 ? (
      <BoardNotice title={emptyTitle} hint={emptyHint} />
    ) : null

  return (
    <>
      <LiveRegion message={message} />
      {content ?? (
        <>
          {isTruncated && (
            <p className="text-muted-foreground border-border-soft flex-none border-b px-4.5 py-2 text-xs">
              {m.board_truncated({ shown: rows.length, total })}
            </p>
          )}
          <div
            ref={rowRef}
            aria-busy={isStale}
            className={cn(
              BOARD_LAYOUT,
              'transition-opacity',
              isStale && 'pointer-events-none opacity-50'
            )}
          >
            {columns.map((column) => (
              <OpportunitiesBoardColumn
                key={column.stage.id}
                column={column}
                stages={stages}
                today={today}
                hiddenFields={hiddenFields}
                dailyRateReference={dailyRateReference}
                onOpen={onOpen}
                onTogglePin={onTogglePin}
                onMove={commitMove}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
