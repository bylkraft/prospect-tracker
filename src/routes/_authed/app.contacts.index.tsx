import { createFileRoute, stripSearchParams, useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import { CONTACTS_SEARCH_DEFAULTS, contactsSearchSchema } from '@/modules/contacts/contacts-schema'
import { ContactsPanel, ContactsPanelSkeleton } from '@/modules/contacts/components/contacts-panel'
import { contactsQueryOptions } from '@/modules/contacts/hooks/use-contacts'
import { toContactsInput } from '@/modules/contacts/utils/search-input'

export const Route = createFileRoute('/_authed/app/contacts/')({
  ssr: 'data-only',

  validateSearch: contactsSearchSchema,
  search: { middlewares: [stripSearchParams(CONTACTS_SEARCH_DEFAULTS)] },
  loaderDeps: ({ search }) => search,

  loader: ({ context: { queryClient }, deps }) => {
    queryClient.prefetchQuery(contactsQueryOptions(toContactsInput(deps)))
  },

  component: Contacts,
  pendingComponent: ContactsPending,
  errorComponent: ContactsError
})

function Contacts() {
  return <ContactsPanel />
}

function ContactsPending() {
  const { perPage } = Route.useSearch()

  return <ContactsPanelSkeleton rowCount={perPage} />
}

function ContactsError() {
  const router = useRouter()

  return (
    <ErrorState description={m.error_dashboardDescription()} onRetry={() => router.invalidate()} />
  )
}
