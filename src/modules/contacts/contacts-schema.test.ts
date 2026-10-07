import { describe, expect, it } from 'vitest'

import type { EmailLabel, PhoneLabel } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import {
  contactFormSchema,
  createContactSchema,
  isIdentified,
  updateContactSchema
} from './contacts-schema'
import { toContactFormValues } from './utils/form-values'

const parse = (overrides: Partial<ReturnType<typeof toContactFormValues>> = {}) =>
  contactFormSchema.safeParse({
    ...toContactFormValues(null),
    lastName: 'Vasseur',
    ...overrides
  })

const email = (value: string, label: EmailLabel | null = null) => ({ value, label })
const phone = (value: string, label: PhoneLabel | null = null) => ({ value, label })

describe('contactFormSchema', () => {
  it('turns blank strings into null', () => {
    const result = parse()

    expect(result.success).toBe(true)
    expect(result.data?.company).toBeNull()
    expect(result.data?.city).toBeNull()
  })

  it('drops the empty row the form always renders', () => {
    const result = parse({ emails: [email('')], phones: [phone('  ')] })

    expect(result.success).toBe(true)
    expect(result.data?.emails).toEqual([])
    expect(result.data?.phones).toEqual([])
  })

  it('keeps several emails and phones, in the order they were entered', () => {
    const result = parse({
      emails: [email('a@alten.fr'), email('b@alten.fr')],
      phones: [phone('+33 6 12 34 56 78'), phone('0320123456')]
    })

    expect(result.success).toBe(true)
    expect(result.data?.emails).toEqual([email('a@alten.fr'), email('b@alten.fr')])
    expect(result.data?.phones).toEqual([phone('+33 6 12 34 56 78'), phone('0320123456')])
  })

  it('keeps the label when one is picked', () => {
    const result = parse({
      phones: [phone('+33 6 12 34 56 78', 'mobile'), phone('0320123456', 'office')],
      emails: [email('a@alten.fr', 'work')]
    })

    expect(result.success).toBe(true)
    expect(result.data?.phones.map((entry) => entry.label)).toEqual(['mobile', 'office'])
    expect(result.data?.emails[0]?.label).toBe('work')
  })

  it('rejects a label outside the vocabulary', () => {
    const result = parse({
      phones: [{ value: '0612345678', label: 'perso' as PhoneLabel }]
    })

    expect(result.success).toBe(false)
  })

  it('rejects a malformed email among valid ones', () => {
    const result = parse({ emails: [email('a@alten.fr'), email('not-an-email')] })

    expect(result.success).toBe(false)
  })

  it('requires a name or a company — the check constraint, surfaced as a field error', () => {
    const result = parse({ firstName: '', lastName: '', company: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      m.validation_contactIdentityRequired()
    )
  })

  it('accepts a company with no person attached', () => {
    const result = parse({ firstName: '', lastName: '', company: 'Alten' })

    expect(result.success).toBe(true)
  })
})

describe('updateContactSchema', () => {
  const id = '22222222-2222-4222-8222-222222222222'

  it('accepts a patch that touches no name at all', () => {
    const result = updateContactSchema.safeParse({ id, city: 'Lille' })

    expect(result.success).toBe(true)
  })

  it('leaves the identity rule to the server, even when the patch blanks all three', () => {
    const result = updateContactSchema.safeParse({
      id,
      firstName: null,
      lastName: null,
      company: null
    })

    expect(result.success).toBe(true)
  })

  it('accepts a patch that keeps one name', () => {
    const result = updateContactSchema.safeParse({ id, firstName: null, lastName: 'Vasseur' })

    expect(result.success).toBe(true)
  })

  it('omits absent keys instead of defaulting them', () => {
    const result = updateContactSchema.parse({ id })

    expect(result).toEqual({ id })
  })

  it('keeps explicitly sent list values', () => {
    const result = updateContactSchema.parse({
      id,
      emails: [email('t@v.co', 'work')],
      relationship: 'end_client'
    })

    expect(result).toMatchObject({
      emails: [email('t@v.co', 'work')],
      relationship: 'end_client'
    })
  })

  it('still rejects an invalid email inside a patch', () => {
    expect(updateContactSchema.safeParse({ id, emails: [email('nope')] }).success).toBe(false)
  })

  it('defaults the lists on create, where the row is new', () => {
    const result = createContactSchema.parse({ lastName: 'Vasseur' })

    expect(result).toMatchObject({ emails: [], phones: [], relationship: 'other' })
  })

  it('accepts blanking one name, since the others are unknown at this point', () => {
    expect(updateContactSchema.safeParse({ id, firstName: null }).success).toBe(true)
  })
})

describe('isIdentified', () => {
  it('accepts a row keeping any one of the three', () => {
    expect(isIdentified({ firstName: null, lastName: 'Vasseur', company: null })).toBe(true)
    expect(isIdentified({ firstName: null, lastName: null, company: 'Astek' })).toBe(true)
  })

  it('rejects a row that has none of them', () => {
    expect(isIdentified({ firstName: null, lastName: null, company: null })).toBe(false)
  })

  it('is decided on the merged row, not the patch', () => {
    const stored = { firstName: 'Thomas', lastName: 'Vasseur', company: null }

    expect(isIdentified({ ...stored, firstName: null })).toBe(true)
    expect(isIdentified({ ...stored, firstName: null, lastName: null })).toBe(false)
  })
})
