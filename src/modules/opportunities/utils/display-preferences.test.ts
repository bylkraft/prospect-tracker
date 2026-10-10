import { describe, expect, it } from 'vitest'

import { OPPORTUNITIES_SEARCH_DEFAULTS } from '@/modules/opportunities/opportunities-schema'
import {
  parseTrackerDisplay,
  withDisplay,
  withRememberedDisplay
} from '@/modules/opportunities/utils/display-preferences'

const DEFAULTS = { view: 'list', hidden: '' }

describe('parseTrackerDisplay', () => {
  it('falls back to the defaults without a cookie', () => {
    expect(parseTrackerDisplay(undefined)).toEqual(DEFAULTS)
  })

  it('reads a stored display', () => {
    expect(parseTrackerDisplay('{"view":"kanban","hidden":"esn,location"}')).toEqual({
      view: 'kanban',
      hidden: 'esn,location'
    })
  })

  it('normalises like the URL: unknown values fall back field by field', () => {
    expect(parseTrackerDisplay('{"view":"gallery","hidden":"location,nope,esn"}')).toEqual({
      view: 'list',
      hidden: 'esn,location'
    })
    expect(parseTrackerDisplay('{"view":"kanban"}')).toEqual({ view: 'kanban', hidden: '' })
  })

  it('falls back to the defaults on a malformed cookie', () => {
    expect(parseTrackerDisplay('not json')).toEqual(DEFAULTS)
    expect(parseTrackerDisplay('42')).toEqual(DEFAULTS)
  })
})

describe('withRememberedDisplay', () => {
  const remembered = { view: 'kanban' as const, hidden: 'esn' }

  it('fills what the URL leaves at its default', () => {
    expect(withRememberedDisplay({ view: 'list', hidden: '' }, remembered)).toEqual(remembered)
  })

  it('keeps what the URL states', () => {
    expect(withRememberedDisplay({ view: 'kanban', hidden: 'location' }, remembered)).toEqual({
      view: 'kanban',
      hidden: 'location'
    })
    expect(withRememberedDisplay({ view: 'list', hidden: 'location' }, remembered)).toEqual({
      view: 'kanban',
      hidden: 'location'
    })
  })
})

describe('withDisplay', () => {
  const sortedOnEsn = { ...OPPORTUNITIES_SEARCH_DEFAULTS, sort: 'esn:desc', page: 3 }

  it('applies the display and keeps the rest of the search', () => {
    expect(withDisplay(sortedOnEsn, { view: 'kanban', hidden: 'location' })).toEqual({
      ...sortedOnEsn,
      view: 'kanban',
      hidden: 'location'
    })
  })

  it('drops a sort on a column the display hides, back to the first page', () => {
    expect(withDisplay(sortedOnEsn, { view: 'list', hidden: 'esn' })).toEqual({
      ...sortedOnEsn,
      hidden: 'esn',
      sort: '',
      page: 1
    })
  })
})
