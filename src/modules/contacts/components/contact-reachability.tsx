import { m } from '@/i18n/paraglide/messages'
import type { ContactListRow } from '@/modules/contacts/contacts-server'

type Props = {
  contact: Pick<ContactListRow, 'phones' | 'emails'>
}

export function ContactReachability({ contact }: Props) {
  const phone = contact.phones[0]?.value ?? null
  const email = contact.emails[0]?.value ?? null

  if (!phone && !email) return null

  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate tabular-nums">{phone ?? email}</span>
      {phone && email ? (
        <span className="text-muted-foreground truncate text-xs">{email}</span>
      ) : null}
      {!phone && email ? (
        <span className="text-muted-foreground truncate text-xs">{m.contact_noNumber()}</span>
      ) : null}
    </span>
  )
}
