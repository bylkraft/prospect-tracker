import { Bell, MoreHorizontal } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { PinButton } from '@/modules/opportunities/components/pin-button'
import { contactDisplayName, primaryContact } from '@/modules/contacts/utils/display'
import {
  formatDailyRate,
  formatRelativeDate,
  isAboveReference,
  opportunityLabel
} from '@/modules/opportunities/utils/display'
import { BOARD_ID } from '@/modules/opportunities/utils/board'
import { CARD_LAYOUT } from '@/shared/board/components/board-layout'
import { useBoardCard } from '@/shared/board/hooks/use-board-dnd'
import type { Stage } from '@/db/schema'
import type { HidableField } from '@/modules/opportunities/utils/display-settings'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Props = {
  row: OpportunityRow
  stages: Stage[]
  today: string
  hiddenFields: readonly HidableField[]
  dailyRateReference: number
  onOpen: () => void
  onTogglePin: () => void
  onMove: (stageId: string) => void
}

export function OpportunityCard({
  row,
  stages,
  today,
  hiddenFields,
  dailyRateReference,
  onOpen,
  onTogglePin,
  onMove
}: Props) {
  const label = opportunityLabel(row)
  const contact = primaryContact(row.contacts)
  // A card in an archived column is no way into it: dropping on it must not reach that stage.
  const { ref, focusRef, isDragging, beforeMenuMove } = useBoardCard(
    BOARD_ID,
    row.id,
    row.stageId,
    !row.stage?.isArchived
  )

  const shows = (field: HidableField) => !hiddenFields.includes(field)

  const showsEsn = row.esn !== null && shows('esn')
  const showsEndClient = row.endClient !== null && shows('endClient')
  const showsDate = shows('lastContactAt')
  const showsRate = shows('dailyRate')

  // Everything the card can be moved to — its own column is not a destination.
  const destinations = stages.filter((stage) => !stage.isArchived && stage.id !== row.stageId)

  return (
    <div
      ref={ref}
      // Pointer only; the keyboard goes through the title — see docs/reference/board-mechanism.md
      onClick={onOpen}
      className={cn(
        CARD_LAYOUT,
        // The whole card drags — see docs/reference/board-mechanism.md
        'cursor-grab active:cursor-grabbing',
        'transition-[color,background-color,border-color,box-shadow,opacity,translate,scale] duration-300 ease-out',
        // A 2px lift: the column scroller clips, and its top padding is only 4px.
        !isDragging && 'hover:border-ring/40 hover:shadow-md motion-safe:hover:-translate-y-0.5',
        // Held while the menu is open, or the card flickers on the way to the popup.
        'has-data-popup-open:border-ring/40 has-data-popup-open:shadow-md motion-safe:has-data-popup-open:-translate-y-0.5',
        'has-[[data-card-open]:focus-visible]:ring-ring has-[[data-card-open]:focus-visible]:ring-2',
        row.isPinned && 'bg-accent/35',
        // Picked up: the card settles back into the column while its preview leaves.
        isDragging && 'scale-98 opacity-40'
      )}
    >
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          {/* Click-through, so the title still drags — see docs/reference/board-mechanism.md */}
          <Button
            ref={focusRef}
            variant="ghost"
            data-card-open
            className="pointer-events-none h-auto max-w-full justify-start rounded-sm p-0 font-semibold focus-visible:border-transparent focus-visible:ring-0"
          >
            <span className="truncate">{row.need ?? label}</span>
          </Button>
          {row.need !== null && contact && (
            <span className="text-muted-foreground block truncate text-xs">
              {contactDisplayName(contact)}
            </span>
          )}
        </div>

        <div className="flex flex-none items-center">
          <PinButton isPinned={row.isPinned} onToggle={onTogglePin} />
          {destinations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={m.table_rowActions()}
                    className="text-muted-foreground hover:text-foreground"
                  />
                }
                // The card itself opens the editor; the menu must not trigger it too.
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              {/* Dragging is an addition, never a replacement — see docs/reference/board-mechanism.md */}
              <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{m.board_moveGroupLabel()}</DropdownMenuLabel>
                  {destinations.map((stage) => (
                    <DropdownMenuItem
                      key={stage.id}
                      onClick={() => {
                        beforeMenuMove()
                        onMove(stage.id)
                      }}
                    >
                      {stage.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Rendered only when filled — see docs/reference/kanban-view.md */}
      {(showsEsn || showsEndClient) && (
        <div className="text-muted-foreground flex min-w-0 flex-col gap-0.5 text-xs">
          {showsEsn && <span className="truncate">{row.esn}</span>}
          {showsEndClient && <span className="truncate">{row.endClient}</span>}
        </div>
      )}

      {(showsDate || showsRate) && (
        <div className="flex items-center gap-2">
          {showsDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold',
                row.isDue ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {row.isDue && <Bell className="size-3" />}
              {formatRelativeDate(row.lastContactAt, today)}
            </span>
          )}
          {showsRate && (
            <span
              className={cn(
                'ml-auto text-xs font-semibold tabular-nums',
                row.dailyRate === null
                  ? 'text-muted-foreground'
                  : isAboveReference(row.dailyRate, dailyRateReference)
                    ? 'text-rate-above'
                    : 'text-rate-below'
              )}
            >
              {formatDailyRate(row.dailyRate)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
