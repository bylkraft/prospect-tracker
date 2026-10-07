import { queryOptions, useQuery } from '@tanstack/react-query'

import { getContact, getContacts, searchContacts } from '@/modules/contacts/contacts-server'
import type { GetContactsInput } from '@/modules/contacts/contacts-schema'

export const CONTACTS_QUERY_KEY = ['contacts']

export const contactsQueryOptions = (input: GetContactsInput) =>
  queryOptions({
    queryKey: [...CONTACTS_QUERY_KEY, 'page', input],
    queryFn: () => getContacts({ data: input }),

    placeholderData: (previous) => previous
  })

export function useContacts(input: GetContactsInput) {
  return useQuery(contactsQueryOptions(input))
}

export const contactQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...CONTACTS_QUERY_KEY, 'detail', id],
    queryFn: () => getContact({ data: { id } })
  })

export function useContact(id: string) {
  return useQuery(contactQueryOptions(id))
}

export function usePickerContacts(q: string, excludeIds: string[], enabled: boolean) {
  const query = useQuery({
    queryKey: [...CONTACTS_QUERY_KEY, 'picker', q, excludeIds],
    queryFn: () => searchContacts({ data: { q, excludeIds } }),
    enabled,
    placeholderData: (previous) => previous
  })

  return { ...query, isStale: query.isPlaceholderData }
}
