import type { OpportunityFormValues } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

// A non-numeric entry stays a string so z.int() rejects it, rather than becoming NaN or 0.
export function toNumeric(value: unknown) {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  if (trimmed === '') return null

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? parsed : trimmed
}

export function toOptionalText(value: unknown) {
  if (typeof value !== 'string') return value

  return value.trim() === '' ? null : value.trim()
}

// A form-side convenience; the server still resolves the real due date with coalesce().
// See docs/reference/opportunity-form.md
export function suggestedReminder(today: string, delayDays: number) {
  const date = new Date(`${today}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''

  date.setDate(date.getDate() + delayDays)

  // Formatted from the local parts, never toISOString(): the date was built at local midnight, and
  // converting to UTC shifts it a day back for anyone east of Greenwich.
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

// Drives the hint only — see docs/reference/opportunity-form.md
export function isAutomaticReminder(
  nextReminderAt: string,
  lastContactAt: string,
  delayDays: number
) {
  if (!nextReminderAt || !lastContactAt) return false

  return nextReminderAt === suggestedReminder(lastContactAt, delayDays)
}

// `today` is injected to keep this pure — see docs/reference/opportunity-form.md
export function toFormValues(
  row: OpportunityRow | null,
  fallbackStageId: string,
  today = '',
  reminderDelayDays = 0
) {
  const text = (value: string | null | undefined) => value ?? ''
  const numeric = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value)

  return {
    stageId: row?.stageId ?? fallbackStageId,
    jobTypeId: row?.jobTypeId ?? null,
    experienceId: row?.experienceId ?? null,
    contactIds: row ? row.contacts.map((contact) => contact.id) : [],
    esn: text(row?.esn),
    endClient: text(row?.endClient),
    need: text(row?.need),
    dailyRate: numeric(row?.dailyRate),
    // Select-backed: null is "not specified", where an empty string would be a value.
    onsiteDays:
      row?.onsiteDays === null || row?.onsiteDays === undefined ? null : String(row.onsiteDays),
    location: text(row?.location),
    lastContactAt: row ? text(row.lastContactAt) : today,
    nextReminderAt: row
      ? text(row.nextReminderAt)
      : today && reminderDelayDays > 0
        ? suggestedReminder(today, reminderDelayDays)
        : '',
    offerUrl: text(row?.offerUrl),
    notes: text(row?.notes)
  } satisfies OpportunityFormValues
}
