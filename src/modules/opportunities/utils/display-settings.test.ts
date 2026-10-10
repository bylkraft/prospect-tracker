import { describe, expect, it } from 'vitest'

import {
  hidableFieldsFor,
  HIDABLE_FIELDS,
  isView,
  parseHiddenFields,
  serializeHiddenFields,
  sortsOnHidden,
  toggleHiddenField
} from '@/modules/opportunities/utils/display-settings'

describe('isView', () => {
  it('accepts the two views and nothing else', () => {
    expect(isView('list')).toBe(true)
    expect(isView('kanban')).toBe(true)
    expect(isView('gallery')).toBe(false)
  })
})

describe('hidableFieldsFor', () => {
  it('offers every field in list view', () => {
    expect(hidableFieldsFor('list')).toEqual(HIDABLE_FIELDS)
  })

  // The card draws no location, so offering it would toggle nothing on screen.
  it('drops the location in kanban, which the card does not draw', () => {
    expect(hidableFieldsFor('kanban')).not.toContain('location')
  })

  it('offers only fields the shared vocabulary knows', () => {
    expect(hidableFieldsFor('kanban').every((f) => HIDABLE_FIELDS.includes(f))).toBe(true)
  })
})

describe('parseHiddenFields', () => {
  it('drops anything that is not a hidable field', () => {
    expect(parseHiddenFields('esn,contact,nonsense,location')).toEqual(['esn', 'location'])
  })

  it('reads an empty string as nothing hidden', () => {
    expect(parseHiddenFields('')).toEqual([])
  })
})

describe('serializeHiddenFields', () => {
  // Canonical order, so two ways of hiding the same pair produce one URL.
  it('writes the fields in their declared order', () => {
    expect(serializeHiddenFields(['location', 'esn'])).toBe('esn,location')
  })

  it('writes nothing when no field is hidden', () => {
    expect(serializeHiddenFields([])).toBe('')
  })
})

describe('toggleHiddenField', () => {
  it('hides a visible field', () => {
    expect(toggleHiddenField([], 'esn')).toEqual(['esn'])
  })

  it('shows a hidden one again', () => {
    expect(toggleHiddenField(['esn', 'location'], 'esn')).toEqual(['location'])
  })
})

describe('sortsOnHidden', () => {
  it('is true only when the sorted column is hidden', () => {
    expect(sortsOnHidden('esn:desc', ['esn'])).toBe(true)
    expect(sortsOnHidden('esn:asc', ['location'])).toBe(false)
    expect(sortsOnHidden('', ['esn'])).toBe(false)
  })
})
