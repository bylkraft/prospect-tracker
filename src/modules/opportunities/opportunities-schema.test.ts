import { describe, expect, it } from 'vitest'

import { m } from '@/i18n/paraglide/messages'
import { opportunityFormSchema } from './opportunities-schema'
import { FIXTURE_STAGE_ID, makeRow } from './utils/opportunity-fixture'
import { toFormValues } from './utils/form-values'

const parse = (overrides: Partial<ReturnType<typeof toFormValues>> = {}) =>
  opportunityFormSchema.safeParse({
    ...toFormValues(null, FIXTURE_STAGE_ID),
    ...overrides
  })

describe('opportunityFormSchema', () => {
  it('turns blank strings into null', () => {
    const result = parse()

    expect(result.success).toBe(true)
    expect(result.data?.esn).toBeNull()
    expect(result.data?.dailyRate).toBeNull()
    expect(result.data?.lastContactAt).toBeNull()
  })

  it('turns numeric strings into numbers', () => {
    const result = parse({ dailyRate: '650', onsiteDays: '3' })

    expect(result.success).toBe(true)
    expect(result.data?.dailyRate).toBe(650)
    expect(result.data?.onsiteDays).toBe(3)
  })

  it('rejects a non-numeric day rate with the integer message', () => {
    const result = parse({ dailyRate: 'abc' })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      m.validation_dailyRateInt()
    ])
  })

  it('rejects a whitespace-only day rate rather than reading it as zero', () => {
    const result = parse({ dailyRate: ' ' })

    expect(result.success).toBe(true)
    expect(result.data?.dailyRate).toBeNull()
  })

  it('accepts an opportunity with no contact linked', () => {
    const result = parse({ contactIds: [] })

    expect(result.success).toBe(true)
    expect(result.data?.contactIds).toEqual([])
  })

  it('rejects the same contact linked twice', () => {
    const contactId = '22222222-2222-4222-8222-222222222222'
    const result = parse({ contactIds: [contactId, contactId] })

    expect(result.success).toBe(false)
  })

  it('round-trips an edited row back to the values it came from', () => {
    const row = makeRow({
      dailyRate: 650,
      onsiteDays: 2,
      esn: 'Devoteam',
      lastContactAt: '2026-01-09'
    })

    const result = opportunityFormSchema.safeParse(toFormValues(row, FIXTURE_STAGE_ID))

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      dailyRate: 650,
      onsiteDays: 2,
      esn: 'Devoteam',
      lastContactAt: '2026-01-09'
    })
  })
})
