import { useNavigate, useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.contacts.index'
import { useTableSearch } from '@/shared/table/hooks/use-table-search'
import { CONTACTS_SEARCH_DEFAULTS, type ContactsSearch } from '@/modules/contacts/contacts-schema'

export function useContactsFilters() {
  const search = useSearch({ from: Route.id })
  const navigate = useNavigate({ from: Route.fullPath })

  const { sorting, pagination, setSearchFromFirstPage, setSorting, setPagination } =
    useTableSearch<ContactsSearch>({
      search,
      onSearchChange: (patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true })
      },
      firstPage: CONTACTS_SEARCH_DEFAULTS.page
    })

  const query = search.q.trim()

  return {
    search: search.q,
    query,
    relationship: search.relationship,
    hasFilters: query.length > 0 || search.relationship !== '',
    sorting,
    pagination,
    setSearch: (q: string) => setSearchFromFirstPage({ q }),
    setRelationship: (relationship: ContactsSearch['relationship']) =>
      setSearchFromFirstPage({ relationship }),
    setSorting,
    setPagination,
    resetFilters: () =>
      setSearchFromFirstPage({
        q: CONTACTS_SEARCH_DEFAULTS.q,
        relationship: CONTACTS_SEARCH_DEFAULTS.relationship
      })
  }
}
