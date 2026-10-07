import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { QueryGate } from '@/components/query-gate'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'
import { ContactSheet } from '@/modules/contacts/components/contact-sheet'
import {
  ContactsTable,
  contactsCardCellClassName,
  contactsCellPlaceholder,
  CONTACTS_CARD_TEMPLATE,
  CONTACTS_COLUMN_IDS,
  CONTACTS_GRID_TEMPLATE,
  CONTACTS_SILENT_COLUMN_ID
} from '@/modules/contacts/components/contacts-table'
import {
  ContactsToolbar,
  ContactsToolbarSkeleton
} from '@/modules/contacts/components/contacts-toolbar'
import { DeleteContactDialog } from '@/modules/contacts/components/delete-contact-dialog'
import { useContactEditor } from '@/modules/contacts/hooks/use-contact-editor'
import { useContacts } from '@/modules/contacts/hooks/use-contacts'
import { useContactsFilters } from '@/modules/contacts/hooks/use-contacts-filters'
import { useContactsInput } from '@/modules/contacts/hooks/use-contacts-input'
import { contactDisplayName } from '@/modules/contacts/utils/display'
import { DataTableSkeleton } from '@/shared/table/components/data-table-skeleton'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col'
const PANEL_CARD_LAYOUT =
  'bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'

export function ContactsPanel() {
  const filters = useContactsFilters()
  const navigate = useNavigate()
  const pageQuery = useContacts(useContactsInput())
  const editor = useContactEditor()

  const [lastDeletingName, setLastDeletingName] = useState('')
  const deletingName = editor.deleting ? contactDisplayName(editor.deleting) : ''

  if (deletingName && deletingName !== lastDeletingName) setLastDeletingName(deletingName)

  return (
    <div className={PANEL_LAYOUT}>
      <div className={PANEL_CARD_LAYOUT}>
        <QueryGate
          queries={[pageQuery]}
          skeleton={<ContactsTableSkeleton rowCount={filters.pagination.pageSize} />}
        >
          {([page]) => (
            <>
              <ContactsToolbar
                total={page.total}
                searchTotal={page.searchTotal}
                relationshipCounts={page.relationshipCounts}
              />
              <ContactsTable
                rows={page.rows}
                total={page.total}
                servedPage={page.page}
                pageCount={page.pageCount}
                isFetching={pageQuery.isFetching}
                onOpen={(row) =>
                  void navigate({
                    to: APP_ROUTES.contactDetail,
                    params: { contactId: row.id }
                  })
                }
                onEdit={editor.openEdit}
                onDelete={editor.requestDelete}
                emptyTitle={filters.hasFilters ? m.contact_noResults() : m.contact_empty()}
                emptyHint={filters.hasFilters ? m.contact_noResultsHint() : m.contact_emptyHint()}
              />
            </>
          )}
        </QueryGate>
      </div>

      <ContactSheet
        open={editor.editor !== null}
        onOpenChange={(next) => {
          if (!next) editor.closeEditor()
        }}
        contact={editor.editor?.contact ?? null}
        onSubmit={async (values) => void (await editor.submit(values))}
        onDelete={(contact) => {
          editor.closeEditor()
          editor.requestDelete(contact)
        }}
      />

      <DeleteContactDialog
        open={editor.deleting !== null}
        onOpenChange={(next) => {
          if (!next) editor.cancelDelete()
        }}
        name={deletingName || lastDeletingName}
        isPending={editor.isDeleting}
        onConfirm={() => void editor.confirmDelete()}
      />
    </div>
  )
}

function ContactsTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      <ContactsToolbarSkeleton />
      <DataTableSkeleton
        gridTemplate={CONTACTS_GRID_TEMPLATE}
        cardTemplate={CONTACTS_CARD_TEMPLATE}
        cardCellClassName={contactsCardCellClassName}
        cellPlaceholder={contactsCellPlaceholder}
        columnIds={CONTACTS_COLUMN_IDS}
        rowCount={rowCount}
        silentColumnId={CONTACTS_SILENT_COLUMN_ID}
      />
    </>
  )
}

export function ContactsPanelSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div className={PANEL_LAYOUT}>
      <div className={PANEL_CARD_LAYOUT}>
        <ContactsTableSkeleton rowCount={rowCount} />
      </div>
    </div>
  )
}
