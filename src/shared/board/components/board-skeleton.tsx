import { Skeleton } from '@/components/ui/skeleton'
import {
  BOARD_LAYOUT,
  COLUMN_HEADER_LAYOUT,
  COLUMN_LAYOUT,
  COLUMN_SCROLLER_LAYOUT
} from '@/shared/board/components/board-layout'

type Props = {
  columnCount: number
  cardCount: number
}

export function BoardSkeleton({ columnCount, cardCount }: Props) {
  return (
    <div className={BOARD_LAYOUT}>
      {Array.from({ length: columnCount }, (_, column) => (
        <div key={column} className={COLUMN_LAYOUT}>
          <div className={COLUMN_HEADER_LAYOUT}>
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className={COLUMN_SCROLLER_LAYOUT}>
            {Array.from({ length: cardCount }, (_, card) => (
              <Skeleton key={card} className="h-27 flex-none rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
