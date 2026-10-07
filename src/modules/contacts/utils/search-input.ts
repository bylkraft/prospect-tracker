import { toContactSortColumn } from '@/modules/contacts/utils/display'
import { parseSort, toPaginationState } from '@/shared/table/table-utils'
import type { ContactsSearch, GetContactsInput } from '@/modules/contacts/contacts-schema'

export function toContactsInput(search: ContactsSearch): GetContactsInput {
  const sorting = parseSort(search.sort)
  const pagination = toPaginationState(search.page, search.perPage)

  return {
    q: search.q.trim(),
    relationship: search.relationship,
    sortBy: sorting[0] ? toContactSortColumn(sorting[0].id) : null,
    sortDesc: sorting[0]?.desc ?? false,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize
  }
}
