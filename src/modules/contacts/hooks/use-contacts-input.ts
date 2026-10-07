import { useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.contacts.index'
import { toContactsInput } from '@/modules/contacts/utils/search-input'
import type { GetContactsInput } from '@/modules/contacts/contacts-schema'

export function useContactsInput(): GetContactsInput {
  return toContactsInput(useSearch({ from: Route.id }))
}

// For the header: during a navigation away it renders after the contacts match is gone.
export function useOptionalContactsInput(): GetContactsInput | null {
  const search = useSearch({ from: Route.id, shouldThrow: false })

  return search ? toContactsInput(search) : null
}
