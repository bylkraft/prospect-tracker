import { createColumnHelper, useTable } from '@tanstack/react-table'

import { m } from '@/i18n/paraglide/messages'
import { cn, formatDate, formatValue } from '@/lib/utils'
import { PinButton } from '@/modules/opportunities/components/pin-button'
import { OpportunityRowActions } from '@/modules/opportunities/components/opportunity-row-actions'
import { StageBadge } from '@/modules/stages/components/stage-badge'
import { DataTable } from '@/shared/table/components/data-table'
import { DataTablePagination } from '@/shared/table/components/data-table-pagination'
import { tableModuleFeatures } from '@/shared/table/table-features'
import { PAGE_SIZES } from '@/modules/opportunities/opportunities-schema'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { contactDisplayName, primaryContact } from '@/modules/contacts/utils/display'
import {
  formatDailyRate,
  isAboveReference,
  opportunityLabel
} from '@/modules/opportunities/utils/display'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

export const OPPORTUNITIES_GRID_TEMPLATE =
  'grid-cols-[30px_150px_minmax(140px,1fr)_minmax(130px,0.9fr)_minmax(150px,1.15fr)_78px_156px_minmax(120px,0.95fr)_44px]'

const PIN_COLUMN_ID = 'pin'
const ACTIONS_COLUMN_ID = 'actions'

export const OPPORTUNITIES_COLUMN_IDS = [
  PIN_COLUMN_ID,
  'lastContactAt',
  'contact',
  'esn',
  'endClient',
  'dailyRate',
  'stage',
  'location',
  ACTIONS_COLUMN_ID
] as const

export const OPPORTUNITIES_SILENT_COLUMN_ID = ACTIONS_COLUMN_ID
const PIN_SORT = { id: PIN_COLUMN_ID, desc: true } as const

const columnHelper = createColumnHelper<typeof tableModuleFeatures, OpportunityRow>()

const cellClassName = (columnId: string) =>
  columnId === PIN_COLUMN_ID || columnId === ACTIONS_COLUMN_ID
    ? 'justify-center px-0'
    : columnId === 'dailyRate'
      ? 'justify-end'
      : undefined

type Props = {
  rows: OpportunityRow[]
  total: number
  // Clamped server-side, so it can differ from `?page=`. See docs/reference/server-side-table.md
  servedPage: number
  pageCount: number
  isFetching: boolean
  dailyRateReference: number
  onTogglePin: (row: OpportunityRow) => void
  onEdit: (row: OpportunityRow) => void
  onToggleArchive: (row: OpportunityRow) => void
  onDelete: (row: OpportunityRow) => void
  emptyTitle: string
  emptyHint: string
}

export function OpportunitiesTable({
  rows,
  total,
  servedPage,
  pageCount,
  isFetching,
  dailyRateReference,
  onTogglePin,
  onEdit,
  onToggleArchive,
  onDelete,
  emptyTitle,
  emptyHint
}: Props) {
  const { sorting, pagination, setSorting, setPagination } = useOpportunitiesFilters()

  const paginationLabels = {
    range: m.table_rangeLabel,
    pageOf: m.table_pageOf,
    perPage: m.table_perPage(),
    firstPage: m.table_firstPage(),
    previousPage: m.table_previousPage(),
    nextPage: m.table_nextPage(),
    lastPage: m.table_lastPage()
  }

  const columns = columnHelper.columns([
    columnHelper.accessor('isPinned', {
      id: PIN_COLUMN_ID,
      sortFn: 'basic',
      cell: ({ row }) => (
        <PinButton isPinned={row.original.isPinned} onToggle={() => onTogglePin(row.original)} />
      )
    }),
    columnHelper.accessor('lastContactAt', {
      header: m.table_colLastContact(),
      cell: ({ getValue, row }) => (
        <span
          className={cn(
            'font-semibold',
            row.original.isDue ? 'text-destructive' : 'text-foreground'
          )}
        >
          {formatDate(getValue())}
        </span>
      )
    }),
    columnHelper.accessor((row) => primaryContactLabel(row), {
      id: 'contact',
      header: m.table_colContact(),
      cell: ({ row }) => {
        const contacts = row.original.contacts
        const contact = primaryContact(contacts)

        if (!contact) return <span className="text-muted-foreground">—</span>

        return (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-semibold">{contactDisplayName(contact)}</span>
            {contacts.length > 1 ? (
              <span className="bg-secondary text-muted-foreground text-2xs flex-none rounded-full px-1.25 font-semibold tabular-nums">
                {m.contact_othersCount({ count: contacts.length - 1 })}
              </span>
            ) : null}
          </span>
        )
      }
    }),
    columnHelper.accessor('esn', {
      header: m.table_colEsn(),
      cell: ({ getValue }) => <span className="truncate">{formatValue(getValue())}</span>
    }),
    columnHelper.accessor('endClient', {
      header: m.table_colEndClient(),
      cell: ({ getValue }) => <span className="truncate">{formatValue(getValue())}</span>
    }),
    columnHelper.accessor('dailyRate', {
      header: m.table_colDailyRate(),
      cell: ({ getValue }) => {
        const dailyRate = getValue()

        return (
          <span
            className={cn(
              'font-semibold tabular-nums',
              dailyRate === null
                ? 'text-muted-foreground'
                : isAboveReference(dailyRate, dailyRateReference)
                  ? 'text-rate-above'
                  : 'text-rate-below'
            )}
          >
            {formatDailyRate(dailyRate)}
          </span>
        )
      }
    }),
    columnHelper.accessor((row) => row.stage?.position ?? -1, {
      id: 'stage',
      header: m.table_colStage(),
      cell: ({ row }) => {
        const stage = row.original.stage
        if (!stage) return <span className="text-muted-foreground">—</span>
        return <StageBadge name={stage.name} color={stage.color} />
      }
    }),
    columnHelper.accessor('location', {
      header: m.table_colLocation(),
      cell: ({ getValue }) => <span className="truncate">{formatValue(getValue())}</span>
    }),
    columnHelper.display({
      id: ACTIONS_COLUMN_ID,
      cell: ({ row }) => (
        <OpportunityRowActions
          row={row.original}
          onEdit={() => onEdit(row.original)}
          onToggleArchive={() => onToggleArchive(row.original)}
          onDelete={() => onDelete(row.original)}
        />
      )
    })
  ])

  // Pinning is a permanent lead sort, so pinned rows stay on top of any column sort.
  const sortingWithPin = [PIN_SORT, ...sorting]

  // Served, not requested: paging from a clamped `?page=999` moves relative to what is shown.
  const servedPagination = { pageIndex: servedPage - 1, pageSize: pagination.pageSize }

  const table = useTable({
    features: tableModuleFeatures,
    data: rows,
    columns,
    state: { sorting: sortingWithPin, pagination: servedPagination },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sortingWithPin) : updater
      setSorting(next.filter((entry) => entry.id !== PIN_SORT.id))
    },
    onPaginationChange: (updater) =>
      setPagination(typeof updater === 'function' ? updater(servedPagination) : updater),
    getRowId: (row) => row.id,
    enableSortingRemoval: false,
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    pageCount
  })

  return (
    <>
      <DataTable
        table={table}
        gridTemplate={OPPORTUNITIES_GRID_TEMPLATE}
        isFetching={isFetching}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
        silentColumns={{
          [PIN_COLUMN_ID]: m.table_colPinned(),
          [ACTIONS_COLUMN_ID]: m.table_rowActions()
        }}
        cellClassName={cellClassName}
        rowClassName={(row) => (row.isPinned ? 'bg-accent/35' : undefined)}
        onRowClick={onEdit}
        rowActionLabel={(row) => m.table_editRow({ label: opportunityLabel(row) })}
        caption={m.table_caption()}
      />
      <DataTablePagination table={table} pageSizes={PAGE_SIZES} labels={paginationLabels} />
    </>
  )
}

function primaryContactLabel(row: OpportunityRow) {
  const contact = primaryContact(row.contacts)

  return contact ? contactDisplayName(contact) : ''
}
