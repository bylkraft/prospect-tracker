import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import { ContactDetail, ContactDetailSkeleton } from '@/modules/contacts/components/contact-detail'
import { contactQueryOptions } from '@/modules/contacts/hooks/use-contacts'

export const Route = createFileRoute('/_authed/app/contacts/$contactId')({
  ssr: 'data-only',

  loader: ({ context: { queryClient }, params: { contactId } }) => {
    queryClient.prefetchQuery(contactQueryOptions(contactId))
  },

  component: ContactRecord,
  pendingComponent: ContactDetailSkeleton,
  errorComponent: ContactError
})

function ContactRecord() {
  const { contactId } = Route.useParams()

  return <ContactDetail contactId={contactId} />
}

function ContactError() {
  const router = useRouter()

  return (
    <ErrorState description={m.error_dashboardDescription()} onRetry={() => router.invalidate()} />
  )
}
