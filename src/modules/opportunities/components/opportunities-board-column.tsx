import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { OpportunityCard } from '@/modules/opportunities/components/opportunity-card'
import { BOARD_ID, type BoardColumn } from '@/modules/opportunities/utils/board'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'
import { BoardDropZone } from '@/shared/board/components/board-drop-zone'
import {
  COLUMN_HEADER_LAYOUT,
  COLUMN_LAYOUT,
  COLUMN_SCROLLER_LAYOUT
} from '@/shared/board/components/board-layout'
import { useBoardColumn } from '@/shared/board/hooks/use-board-dnd'
import type { Stage } from '@/db/schema'
import type { HidableField } from '@/modules/opportunities/utils/display-settings'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Props = {
  column: BoardColumn
  stages: Stage[]
  today: string
  hiddenFields: readonly HidableField[]
  dailyRateReference: number
  onOpen: (row: OpportunityRow) => void
  onTogglePin: (row: OpportunityRow) => void
  onMove: (cardId: string, stageId: string) => void
}

export function OpportunitiesBoardColumn({
  column,
  stages,
  today,
  hiddenFields,
  dailyRateReference,
  onOpen,
  onTogglePin,
  onMove
}: Props) {
  const { stage, cards } = column
  // An archived stage is shown only to hold its cards, never offered as a destination — the same
  // rule as the card menu. See docs/reference/kanban-view.md
  const { ref, scrollerRef, isOver } = useBoardColumn(BOARD_ID, stage.id, !stage.isArchived)
  const headingId = `board-column-${stage.id}`

  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      style={{ '--stage-dot': stageColorVar(stage.color) } as React.CSSProperties}
      className={cn(COLUMN_LAYOUT, isOver && 'border-(--stage-dot) bg-(--stage-dot)/5')}
    >
      <h2 id={headingId} className={COLUMN_HEADER_LAYOUT}>
        <StageDot size="md" />
        <span className="min-w-0 flex-1 truncate">{stage.name}</span>
        <span className="text-muted-foreground bg-secondary rounded-full px-1.75 text-xs font-semibold tabular-nums">
          {cards.length}
        </span>
        <span className="sr-only">{m.board_columnCount({ count: cards.length })}</span>
      </h2>

      <div ref={scrollerRef} className={COLUMN_SCROLLER_LAYOUT}>
        {cards.length === 0 ? (
          <BoardDropZone label={m.board_emptyColumn()} isOver={isOver} />
        ) : (
          cards.map((row) => (
            <OpportunityCard
              key={row.id}
              row={row}
              stages={stages}
              today={today}
              hiddenFields={hiddenFields}
              dailyRateReference={dailyRateReference}
              onOpen={() => onOpen(row)}
              onTogglePin={() => onTogglePin(row)}
              onMove={(stageId) => onMove(row.id, stageId)}
            />
          ))
        )}
      </div>
    </section>
  )
}
