import { describe, expect, it } from 'vitest'

import { makeContact, makeLinkedContact } from '@/modules/opportunities/utils/opportunity-fixture'
import {
  contactDisplayName,
  contactInitials,
  matchRange,
  primaryContact,
  relativeDay,
  toRelationshipFilter
} from './display'

describe('contactDisplayName', () => {
  it('joins the first and last name', () => {
    expect(contactDisplayName(makeContact({ firstName: 'Thomas', lastName: 'Vasseur' }))).toBe(
      'Thomas Vasseur'
    )
  })

  it('falls back to the company when no name is stored', () => {
    const contact = makeContact({ firstName: null, lastName: null, company: 'Alten' })

    expect(contactDisplayName(contact)).toBe('Alten')
  })

  it('reads a single-word name — what the recruiter migration produces', () => {
    const contact = makeContact({ firstName: null, lastName: 'Vanessa' })

    expect(contactDisplayName(contact)).toBe('Vanessa')
  })
})

describe('contactInitials', () => {
  it('takes one letter per name part', () => {
    expect(contactInitials(makeContact({ firstName: 'Thomas', lastName: 'Vasseur' }))).toBe('TV')
  })

  it('falls back to the company words', () => {
    const contact = makeContact({ firstName: null, lastName: null, company: 'Sopra Steria' })

    expect(contactInitials(contact)).toBe('SS')
  })
})

describe('primaryContact', () => {
  it('is the first of the list — the contact who pitched', () => {
    const first = makeLinkedContact({ id: 'a' })
    const second = makeLinkedContact({ id: 'b' })

    expect(primaryContact([first, second])).toBe(first)
  })

  it('is null when nothing is linked', () => {
    expect(primaryContact([])).toBeNull()
  })
})

describe('toRelationshipFilter', () => {
  it('keeps a known relationship', () => {
    expect(toRelationshipFilter('esn_manager')).toBe('esn_manager')
  })

  it('reads anything else as the unfiltered state', () => {
    for (const value of ['', 'nonsense', null]) {
      expect(toRelationshipFilter(value)).toBe('')
    }
  })
})

describe('relativeDay', () => {
  const now = new Date(2026, 9, 6, 15, 0)

  it('names yesterday and counts days within the week', () => {
    expect(relativeDay(new Date(2026, 9, 5, 9, 0).toISOString(), now, 'fr')).toBe('hier')
    expect(relativeDay(new Date(2026, 9, 3, 9, 0).toISOString(), now, 'fr')).toBe('il y a 3 jours')
  })

  it('switches to weeks, then months', () => {
    expect(relativeDay(new Date(2026, 8, 28).toISOString(), now, 'fr')).toBe('la semaine dernière')
    expect(relativeDay(new Date(2026, 6, 1).toISOString(), now, 'en')).toBe('3 months ago')
  })
})

describe('matchRange', () => {
  it('ignores case and accents', () => {
    expect(matchRange('Grégoire Aubert', 'gregoire')).toEqual({ start: 0, end: 8 })
    expect(matchRange('Camille Ferrand', 'FERR')).toEqual({ start: 8, end: 12 })
  })

  it('returns null when the term is not in the name', () => {
    expect(matchRange('Camille Ferrand', '0612')).toBeNull()
    expect(matchRange('Camille Ferrand', '  ')).toBeNull()
  })
})
