import { describe, expect, it } from 'vitest'

import { FIXTURE_STAGE_ID, makeRow } from './opportunity-fixture'
import { isAutomaticReminder, toFormValues } from './form-values'

describe('toFormValues', () => {
  it('falls back to the given stage when creating', () => {
    const values = toFormValues(null, FIXTURE_STAGE_ID)

    expect(values.stageId).toBe(FIXTURE_STAGE_ID)
    expect(values.contactIds).toEqual([])
    expect(values.dailyRate).toBe('')
  })

  it('renders nulls as empty strings so inputs stay controlled', () => {
    const values = toFormValues(makeRow(), FIXTURE_STAGE_ID)

    expect(values.esn).toBe('')
    expect(values.dailyRate).toBe('')
    expect(values.jobTypeId).toBeNull()
  })

  it('defaults the last contact date to today when creating', () => {
    const values = toFormValues(null, FIXTURE_STAGE_ID, '2026-08-15')

    expect(values.lastContactAt).toBe('2026-08-15')
  })

  it('keeps the stored last contact date when editing', () => {
    const values = toFormValues(
      makeRow({ lastContactAt: '2026-01-09' }),
      FIXTURE_STAGE_ID,
      '2026-08-15'
    )

    expect(values.lastContactAt).toBe('2026-01-09')
  })

  it('leaves an edited row without a contact date empty', () => {
    const values = toFormValues(makeRow(), FIXTURE_STAGE_ID, '2026-08-15')

    expect(values.lastContactAt).toBe('')
  })

  it('stringifies numbers so they can be typed back', () => {
    const values = toFormValues(makeRow({ dailyRate: 650, onsiteDays: 0 }), FIXTURE_STAGE_ID)

    expect(values.dailyRate).toBe('650')
    expect(values.onsiteDays).toBe('0')
  })
})

describe('toFormValues · suggested reminder', () => {
  it('suggests today plus the stage delay when creating', () => {
    const values = toFormValues(null, 'stage-1', '2026-08-19', 7)

    expect(values.lastContactAt).toBe('2026-08-19')
    expect(values.nextReminderAt).toBe('2026-08-26')
  })

  it('rolls over a month boundary', () => {
    expect(toFormValues(null, 'stage-1', '2026-12-28', 7).nextReminderAt).toBe('2027-01-04')
  })

  // Editing must never rewrite what the user already chose — including an empty reminder.
  it('leaves an existing row untouched', () => {
    const row = makeRow({ lastContactAt: '2026-08-01', nextReminderAt: null })

    expect(toFormValues(row, 'stage-1', '2026-08-19', 7).nextReminderAt).toBe('')
  })

  it('suggests nothing without a stage delay', () => {
    expect(toFormValues(null, 'stage-1', '2026-08-19', 0).nextReminderAt).toBe('')
  })
})

describe('isAutomaticReminder', () => {
  it('recognises a reminder that still matches the stage delay', () => {
    expect(isAutomaticReminder('2026-08-26', '2026-08-19', 7)).toBe(true)
  })

  it('rejects a date the user moved off the rule', () => {
    expect(isAutomaticReminder('2026-09-15', '2026-08-19', 7)).toBe(false)
  })

  it('rejects empty values rather than claiming they are automatic', () => {
    expect(isAutomaticReminder('', '2026-08-19', 7)).toBe(false)
    expect(isAutomaticReminder('2026-08-26', '', 7)).toBe(false)
  })
})
