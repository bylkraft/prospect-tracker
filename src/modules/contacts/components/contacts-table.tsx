import { createColumnHelper, useTable } from '@tanstack/react-table'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { ContactIdentity } from '@/modules/contacts/components/contact-identity'
import { ContactLastOpportunity } from '@/modules/contacts/components/contact-last-opportunity'
import { ContactReachability } from '@/modules/contacts/components/contact-reachability'
import { ContactRowActions } from '@/modules/contacts/components/contact-row-actions'
import { CONTACTS_PAGE_SIZES } from '@/modules/contacts/contacts-schema'
import { useContactsFilters } from '@/modules/contacts/hooks/use-contacts-filters'
import { contactDisplayName } from '@/modules/contacts/utils/display'
import type { ContactListRow } from '@/modules/contacts/contacts-server'
import { DataTable } from '@/shared/table/components/data-table'
import { DataTablePagination } from '@/shared/table/components/data-table-pagination'
import { tableModuleFeatures } from '@/shared/table/table-features'

export const CONTACTS_GRID_TEMPLATE =
  'grid-cols-[minmax(0,1.3fr)_minmax(0,1.05fr)_minmax(0,1.35fr)_76px_36px]'

export const CONTACTS_CARD_TEMPLATE = cn(
  'grid-cols-[minmax(0,1fr)_auto_auto] grid-rows-[auto_auto_auto] items-center gap-x-2.5 px-3 py-3',
  '@3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.05fr)_minmax(0,1.35fr)_76px_36px] @3xl:grid-rows-1 @3xl:items-stretch @3xl:gap-x-0 @3xl:px-0 @3xl:py-0'
)

const CARD_CELL: Record<string, string> = {
  name: 'col-start-1 row-start-1 py-0 @3xl:col-auto @3xl:row-auto @3xl:py-3.5',
  reachability:
    'col-span-3 col-start-1 row-start-2 py-1.5 empty:hidden @3xl:empty:flex @3xl:col-span-1 @3xl:col-auto @3xl:row-auto @3xl:py-3.5',
  lastExchange:
    'border-border-soft col-span-3 col-start-1 row-start-3 mt-0.5 border-t pt-2.5 @3xl:col-span-1 @3xl:col-auto @3xl:row-auto @3xl:mt-0 @3xl:border-t-0 @3xl:pt-0 @3xl:py-3.5',
  opportunities:
    'col-start-2 row-start-1 justify-end self-center py-0 @3xl:col-auto @3xl:row-auto @3xl:self-auto @3xl:py-3.5',
  actions:
    'col-start-3 row-start-1 self-center py-0 @3xl:col-auto @3xl:row-auto @3xl:self-auto @3xl:py-3.5'
}

const ACTIONS_COLUMN_ID = 'actions'

export const CONTACTS_COLUMN_IDS = [
  'name',
  'reachability',
  'lastExchange',
  'opportunities',
  ACTIONS_COLUMN_ID
] as const

export const CONTACTS_SILENT_COLUMN_ID = ACTIONS_COLUMN_ID

export const contactsCardCellClassName = (columnId: string) => CARD_CELL[columnId]

function Lines({ top, bottom }: { top: string; bottom: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="flex h-lh items-center text-sm">
        <Skeleton className={cn('h-2.5 rounded-full', top)} />
      </span>
      <span className="flex h-lh items-center text-xs">
        <Skeleton className={cn('bg-border-soft dark:bg-border h-2.25 rounded-full', bottom)} />
      </span>
    </span>
  )
}

const CONTACTS_CELL_PLACEHOLDER: Record<string, React.ReactNode> = {
  name: (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <Skeleton className="size-9 flex-none rounded-full" />
      <Lines top="w-14/25" bottom="w-9/25" />
    </span>
  ),
  reachability: <Lines top="w-7/10" bottom="w-1/2" />,
  lastExchange: <Lines top="w-4/5" bottom="w-11/25" />,
  opportunities: <Skeleton className="h-6 w-6.5 rounded-[7px]" />
}

export const contactsCellPlaceholder = (columnId: string) => CONTACTS_CELL_PLACEHOLDER[columnId]

const columnHelper = createColumnHelper<typeof tableModuleFeatures, ContactListRow>()

const cellClassName = (columnId: string) =>
  columnId === ACTIONS_COLUMN_ID
    ? 'justify-center px-0'
    : columnId === 'opportunities'
      ? 'justify-end'
      : undefined

type Props = {
  rows: ContactListRow[]
  total: number
  servedPage: number
  pageCount: number
  isFetching: boolean
  onOpen: (row: ContactListRow) => void
  onEdit: (row: ContactListRow) => void
  onDelete: (row: ContactListRow) => void
  emptyTitle: string
  emptyHint: string
}

export function ContactsTable({
  rows,
  total,
  servedPage,
  pageCount,
  isFetching,
  onOpen,
  onEdit,
  onDelete,
  emptyTitle,
  emptyHint
}: Props) {
  const { sorting, pagination, setSorting, setPagination } = useContactsFilters()

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
    columnHelper.accessor((row) => row.lastName ?? row.firstName ?? row.company, {
      id: 'name',
      header: m.contact_colName(),
      cell: ({ row }) => <ContactIdentity contact={row.original} showRelationship size="md" />
    }),
    columnHelper.display({
      id: 'reachability',
      header: m.contact_colReachability(),
      cell: ({ row }) => <ContactReachability contact={row.original} />
    }),
    columnHelper.accessor('lastExchange', {
      id: 'lastExchange',
      header: m.contact_colLastOpportunity(),
      cell: ({ row }) => <ContactLastOpportunity contact={row.original} />
    }),
    columnHelper.accessor('opportunityCount', {
      id: 'opportunities',
      header: m.contact_colOpportunities(),
      cell: ({ getValue }) => (
        <span
          aria-label={m.contact_opportunityCount({ count: getValue() })}
          className="bg-secondary text-muted-foreground @3xl:text-foreground inline-flex h-5.5 min-w-6 items-center justify-center rounded-md px-2 text-xs font-semibold tabular-nums @3xl:h-6 @3xl:min-w-6.5 @3xl:rounded-[7px]"
        >
          {getValue()}
        </span>
      )
    }),
    columnHelper.display({
      id: ACTIONS_COLUMN_ID,
      cell: ({ row }) => (
        <ContactRowActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
        />
      )
    })
  ])

  const servedPagination = { pageIndex: servedPage - 1, pageSize: pagination.pageSize }

  const table = useTable({
    features: tableModuleFeatures,
    data: rows,
    columns,
    state: { sorting, pagination: servedPagination },
    onSortingChange: (updater) =>
      setSorting(typeof updater === 'function' ? updater(sorting) : updater),
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
        gridTemplate={CONTACTS_GRID_TEMPLATE}
        cardTemplate={CONTACTS_CARD_TEMPLATE}
        cardCellClassName={(columnId) => CARD_CELL[columnId]}
        isFetching={isFetching}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
        silentColumns={{ [ACTIONS_COLUMN_ID]: m.contact_rowActions() }}
        cellClassName={cellClassName}
        onRowClick={onOpen}
        rowActionLabel={(row) => m.contact_openRow({ name: contactDisplayName(row) })}
        caption={m.contact_caption()}
      />
      <DataTablePagination
        table={table}
        pageSizes={CONTACTS_PAGE_SIZES}
        labels={paginationLabels}
      />
    </>
  )
}
