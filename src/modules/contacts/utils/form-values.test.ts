import { describe, expect, it } from 'vitest'

import { contactDraftFromSearch, isBlankDraft, toContactDraftValues } from './form-values'

describe('contactDraftFromSearch', () => {
  it('reads a single word as a first name', () => {
    expect(contactDraftFromSearch('Camille')).toEqual({ firstName: 'Camille', lastName: '' })
  })

  it('splits a full name on its last space', () => {
    expect(contactDraftFromSearch('  Jean   Pierre Dupont ')).toEqual({
      firstName: 'Jean Pierre',
      lastName: 'Dupont'
    })
  })

  it('files a number under the phones, as typed', () => {
    expect(contactDraftFromSearch('+33 6 12 34')).toEqual({
      phones: [{ value: '+33 6 12 34', label: null }]
    })
  })

  it('leaves an empty search with nothing to prefill', () => {
    expect(contactDraftFromSearch('   ')).toEqual({})
  })
})

describe('toContactDraftValues', () => {
  it('lays the draft over a blank form', () => {
    const values = toContactDraftValues({ firstName: 'Camille', company: 'Onepoint' })

    expect(values.firstName).toBe('Camille')
    expect(values.company).toBe('Onepoint')
    expect(values.lastName).toBe('')
    expect(values.phones).toEqual([{ value: '', label: null }])
  })
})

describe('isBlankDraft', () => {
  it('sees through empty and whitespace-only fields', () => {
    expect(isBlankDraft({})).toBe(true)
    expect(
      isBlankDraft({ firstName: '', company: '  ', phones: [{ value: ' ', label: null }] })
    ).toBe(true)
  })

  it('counts any prefilled value', () => {
    expect(isBlankDraft({ company: 'Onepoint' })).toBe(false)
    expect(isBlankDraft({ phones: [{ value: '06 12', label: null }] })).toBe(false)
  })
})
