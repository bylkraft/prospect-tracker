import { m } from '@/i18n/paraglide/messages'
import { ContactLinkSearch } from '@/modules/contacts/components/contact-link-search'
import { LinkedContactRow } from '@/modules/contacts/components/linked-contact-row'
import { moveToEdge } from '@/shared/sortable/sortable-utils'
import type { LinkedContact } from '@/modules/contacts/contacts-types'

type Props = {
  contacts: LinkedContact[]
  onLink: (contact: LinkedContact) => void
  onUnlink: (contactId: string) => void
  onReorder: (contactIds: string[]) => void
  onCreateNew: (term: string) => void
}

export function LinkedContactsField({ contacts, onLink, onUnlink, onReorder, onCreateNew }: Props) {
  return (
    <div className="border-border bg-card rounded-xl border">
      {contacts.length === 0 ? (
        <div className="border-border-soft flex flex-col gap-0.75 border-b px-4 py-3.5">
          <span className="text-sm font-semibold">{m.contact_noneLinked()}</span>
          <span className="text-muted-foreground text-xs text-pretty">
            {m.contact_noneLinkedHint()}
          </span>
        </div>
      ) : (
        <ul>
          {contacts.map((contact, index) => (
            <LinkedContactRow
              key={contact.id}
              contact={contact}
              isPrimary={index === 0}
              onMakePrimary={() =>
                onReorder(moveToEdge(contacts, index, 'top').map((entry) => entry.id))
              }
              onUnlink={() => onUnlink(contact.id)}
            />
          ))}
        </ul>
      )}

      <ContactLinkSearch
        linkedIds={contacts.map((contact) => contact.id)}
        onPick={onLink}
        onCreateNew={onCreateNew}
      />
    </div>
  )
}
