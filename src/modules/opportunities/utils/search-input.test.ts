import { describe, expect, it } from 'vitest'

import {
  toBoardInput,
  toDueOnly,
  toOpportunitiesInput
} from '@/modules/opportunities/utils/search-input'
import type { OpportunitiesSearch } from '@/modules/opportunities/opportunities-schema'

const search = (overrides: Partial<OpportunitiesSearch> = {}): OpportunitiesSearch => ({
  tab: 'active',
  view: 'list',
  hidden: '',
  q: '',
  due: false,
  sort: '',
  page: 1,
  perPage: 8,
  ...overrides
})

const TODAY = '2026-08-24'

describe('toDueOnly', () => {
  it('keeps the due filter on the active tab', () => {
    expect(toDueOnly(search({ due: true }))).toBe(true)
  })

  it('drops it on archived, where nothing is ever due', () => {
    expect(toDueOnly(search({ due: true, tab: 'archived' }))).toBe(false)
  })
})

describe('toOpportunitiesInput', () => {
  it('maps a default search to the first page', () => {
    expect(toOpportunitiesInput(search(), TODAY)).toEqual({
      tab: 'active',
      q: '',
      due: false,
      sortBy: null,
      sortDesc: false,
      page: 1,
      perPage: 8,
      today: TODAY
    })
  })

  it('trims the query and splits the sort token', () => {
    const input = toOpportunitiesInput(
      search({ q: '  dev  ', sort: 'dailyRate:desc', page: 3 }),
      TODAY
    )

    expect(input).toMatchObject({ q: 'dev', sortBy: 'dailyRate', sortDesc: true, page: 3 })
  })

  it('rejects a sort column that is not sortable', () => {
    expect(toOpportunitiesInput(search({ sort: 'bogus:asc' }), TODAY).sortBy).toBeNull()
  })

  // The guarantee the route context depends on: same search in, same key out.
  it('is deterministic for a given search', () => {
    const args = search({ q: 'acme', due: true, sort: 'contact:asc', page: 2 })

    expect(toOpportunitiesInput(args, TODAY)).toEqual(toOpportunitiesInput(args, TODAY))
  })
})

describe('toBoardInput', () => {
  it('carries the filters and drops the table slice', () => {
    expect(toBoardInput(search({ q: '  thomas  ', sort: 'contact:asc', page: 3 }), TODAY)).toEqual({
      tab: 'active',
      q: 'thomas',
      due: false,
      today: TODAY
    })
  })

  it('drops the due filter on the archived tab, as the table does', () => {
    expect(toBoardInput(search({ tab: 'archived', due: true }), TODAY).due).toBe(false)
  })
})
