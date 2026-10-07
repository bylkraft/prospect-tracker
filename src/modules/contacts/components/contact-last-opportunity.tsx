import { m } from '@/i18n/paraglide/messages'
import { formatDate } from '@/lib/utils'
import type { ContactListRow } from '@/modules/contacts/contacts-server'

type Props = {
  contact: Pick<ContactListRow, 'lastOpportunity' | 'lastExchange'>
}

export function ContactLastOpportunity({ contact }: Props) {
  const { lastOpportunity, lastExchange } = contact

  if (!lastOpportunity) {
    return <span className="text-muted-foreground">{m.contact_noOpportunity()}</span>
  }

  const client = lastOpportunity.endClient ?? lastOpportunity.esn
  const date = lastExchange ? formatDate(lastExchange) : m.contact_neverContacted()

  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate">{lastOpportunity.need ?? m.contact_untitledOpportunity()}</span>
      <span className="text-muted-foreground truncate text-xs tabular-nums">
        {client ? `${client} · ${date}` : date}
      </span>
    </span>
  )
}
