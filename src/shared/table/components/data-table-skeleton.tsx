import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { DataTablePaginationSkeleton } from '@/shared/table/components/data-table-pagination'
import { CELL_LAYOUT, HEADER_ROW_LAYOUT, ROW_LAYOUT } from '@/shared/table/table-layout'

type Props = {
  gridTemplate: string
  cardTemplate?: string
  cardCellClassName?: (columnId: string) => string | undefined
  columnIds: readonly string[]
  rowCount: number
  silentColumnId?: string
  cellPlaceholder?: (columnId: string) => React.ReactNode
}

export function DataTableSkeleton({
  gridTemplate,
  cardTemplate,
  cardCellClassName,
  columnIds,
  rowCount,
  silentColumnId,
  cellPlaceholder
}: Props) {
  return (
    <>
      <div className="@container flex min-h-0 flex-1 flex-col overflow-x-auto">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            cardTemplate ? 'min-w-0 @3xl:min-w-200' : 'min-w-200'
          )}
        >
          <div className={cn(HEADER_ROW_LAYOUT, gridTemplate, cardTemplate && 'hidden @3xl:grid')}>
            {columnIds.map((columnId) => (
              <div key={columnId} className="flex h-10 items-center px-3.5 py-2.5">
                {columnId === silentColumnId ? null : (
                  <Skeleton className="bg-border h-3 w-full max-w-24" />
                )}
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {Array.from({ length: rowCount }, (_, index) => (
              <div key={index} className={cn(ROW_LAYOUT, cardTemplate ?? gridTemplate)}>
                {columnIds.map((columnId) =>
                  columnId === silentColumnId ? (
                    <div
                      key={columnId}
                      className={cn(
                        'flex items-center justify-center',
                        cardCellClassName?.(columnId)
                      )}
                    >
                      <Skeleton className="size-3.5 rounded-sm" />
                    </div>
                  ) : (
                    <div
                      key={columnId}
                      className={cn(
                        CELL_LAYOUT,
                        !cellPlaceholder && (cardTemplate ? 'h-auto @3xl:h-13' : 'h-13'),
                        cardCellClassName?.(columnId)
                      )}
                    >
                      {cellPlaceholder?.(columnId) ?? <Skeleton className="h-4 w-full" />}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTablePaginationSkeleton />
    </>
  )
}
