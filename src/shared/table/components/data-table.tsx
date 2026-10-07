import type { ReactTable, RowData } from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PaginatedTableFeatures } from '@/shared/table/table-features'
import {
  CELL_LAYOUT,
  HEADER_ROW_LAYOUT,
  ROW_LAYOUT,
  TABLE_CARD_LAYOUT,
  TABLE_LAYOUT
} from '@/shared/table/table-layout'

const SORT_CHEVRON = 'size-2.5'
const SORT_IDLE = 'text-muted-foreground/30'

type Props<TData extends RowData> = {
  table: ReactTable<PaginatedTableFeatures, TData>
  gridTemplate: string
  cardTemplate?: string
  cardCellClassName?: (columnId: string) => string | undefined
  isFetching: boolean
  emptyTitle: string
  emptyHint: string
  silentColumns?: Readonly<Record<string, string>>
  cellClassName?: (columnId: string) => string | undefined
  rowClassName?: (row: TData) => string | undefined
  onRowClick?: (row: TData) => void
  rowActionLabel?: (row: TData) => string
  caption: string
}

export function DataTable<TData extends RowData>({
  table,
  gridTemplate,
  cardTemplate,
  cardCellClassName,
  isFetching,
  emptyTitle,
  emptyHint,
  silentColumns = {},
  cellClassName,
  rowClassName,
  onRowClick,
  rowActionLabel,
  caption
}: Props<TData>) {
  const rows = table.getRowModel().rows
  const headers = table.getHeaderGroups().flatMap((headerGroup) => headerGroup.headers)
  const isEmpty = rows.length === 0

  return (
    <div
      aria-busy={isFetching}
      className={cn(
        '@container min-h-0 flex-1 overflow-auto transition-opacity',
        isFetching && 'pointer-events-none opacity-50'
      )}
    >
      <table
        className={cn(
          cardTemplate ? TABLE_CARD_LAYOUT : TABLE_LAYOUT,
          isEmpty && 'h-full grid-rows-[auto_1fr]'
        )}
      >
        <caption className="sr-only">{caption}</caption>
        <thead
          className={cn('bg-secondary sticky top-0 z-10 grid', cardTemplate && 'hidden @3xl:grid')}
        >
          <tr className={cn(HEADER_ROW_LAYOUT, gridTemplate)}>
            {headers.map((header) => {
              const isSilent = header.column.id in silentColumns
              const isSorted = header.column.getIsSorted()

              if (isSilent)
                return (
                  <th key={header.id} scope="col">
                    <span className="sr-only">{silentColumns[header.column.id]}</span>
                  </th>
                )

              return (
                <th
                  key={header.id}
                  scope="col"
                  aria-sort={
                    isSorted === 'asc' ? 'ascending' : isSorted === 'desc' ? 'descending' : 'none'
                  }
                  className="grid"
                >
                  <Button
                    variant="ghost"
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      'tracking-label text-2xs h-auto gap-1.25 rounded-none px-3.5 py-2.5 font-semibold uppercase',
                      'hover:text-foreground hover:bg-transparent active:bg-transparent data-pressed:bg-transparent',
                      'justify-start',
                      cellClassName?.(header.column.id),
                      isSorted ? 'text-secondary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    <table.FlexRender header={header} />
                    <span className="flex flex-col leading-none" aria-hidden="true">
                      <ChevronUp
                        className={cn(
                          SORT_CHEVRON,
                          isSorted === 'asc' ? 'text-primary' : SORT_IDLE
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          '-mt-0.5',
                          SORT_CHEVRON,
                          isSorted === 'desc' ? 'text-primary' : SORT_IDLE
                        )}
                      />
                    </span>
                  </Button>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody className={cn('grid', isEmpty && 'grid-rows-[1fr]')}>
          {isEmpty ? (
            <tr className="grid">
              <td
                colSpan={headers.length}
                className="flex flex-col items-center justify-center gap-1 px-4 py-14 text-center"
              >
                <span className="font-semibold">{emptyTitle}</span>
                <span className="text-muted-foreground text-xs">{emptyHint}</span>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                // A <tr> gets no keyboard affordance from a click handler alone.
                {...(onRowClick && {
                  role: 'button',
                  tabIndex: 0,
                  'aria-label': rowActionLabel?.(row.original),
                  onClick: () => onRowClick(row.original),
                  onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    // Space scrolls the table otherwise.
                    event.preventDefault()
                    onRowClick(row.original)
                  }
                })}
                className={cn(
                  ROW_LAYOUT,
                  'hover:bg-accent/60 transition-colors',
                  onRowClick &&
                    'focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                  cardTemplate ?? gridTemplate,
                  rowClassName?.(row.original)
                )}
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      CELL_LAYOUT,
                      cellClassName?.(cell.column.id),
                      cardTemplate && cardCellClassName?.(cell.column.id)
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
