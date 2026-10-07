import { Plus } from 'lucide-react'
import { Link, useHydrated } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'
import { CONTACTS_SEARCH_DEFAULTS } from '@/modules/contacts/contacts-schema'
import { toContactsInput } from '@/modules/contacts/utils/search-input'
import { contactDisplayName } from '@/modules/contacts/utils/display'
import { contactQueryOptions, contactsQueryOptions } from '@/modules/contacts/hooks/use-contacts'
import { useOptionalContactsInput } from '@/modules/contacts/hooks/use-contacts-input'
import { useContactCreateContext } from '@/modules/opportunities/components/opportunity-editor-provider'

const EMPTY_INPUT = toContactsInput(CONTACTS_SEARCH_DEFAULTS)

export function ContactsHeaderSubtitle() {
  const input = useOptionalContactsInput()

  const { data } = useQuery({
    ...contactsQueryOptions(input ?? EMPTY_INPUT),
    enabled: input !== null
  })
  // Shell data waits for hydration — see docs/reference/query-prefetching.md
  const isHydrated = useHydrated()

  if (!isHydrated || !data) return <Skeleton className="h-3 w-18 md:w-32" />

  return (
    <span className="text-muted-foreground truncate text-xs leading-none">
      {m.contact_totalCount({ count: data.total })}
    </span>
  )
}

export function ContactBreadcrumb({ contactId }: { contactId: string }) {
  const { data } = useQuery(contactQueryOptions(contactId))
  const isHydrated = useHydrated()
  const name = isHydrated && data ? contactDisplayName(data.contact) : null

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap gap-1.5 text-sm">
        <BreadcrumbItem className="flex-none">
          <BreadcrumbLink
            className="text-muted-foreground hover:text-foreground text-[13.5px]"
            render={<Link to={APP_ROUTES.contacts} search={CONTACTS_SEARCH_DEFAULTS} />}
          >
            {m.contact_pageTitle()}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="flex-none" />
        <BreadcrumbItem className="min-w-0">
          {name ? (
            <BreadcrumbPage className="font-heading tracking-page-title text-foreground truncate text-lg font-semibold">
              {name}
            </BreadcrumbPage>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function ContactsHeaderAction() {
  const openCreate = useContactCreateContext()

  return (
    <Button
      size="md"
      onClick={() => openCreate()}
      className="font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
    >
      <Plus />
      <span className="max-sm:sr-only">{m.contact_createCta()}</span>
    </Button>
  )
}
