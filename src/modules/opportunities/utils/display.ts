import { m } from '@/i18n/paraglide/messages'
import { contactDisplayName, primaryContact } from '@/modules/contacts/utils/display'
import { CONFIG } from '@/lib/config'
import { formatValue } from '@/lib/utils'
import { NOTES_MAX_LENGTH, SORT_COLUMNS } from '@/modules/opportunities/opportunities-schema'
import type { SortColumn } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

export function toSortColumn(value: string): SortColumn | null {
  return SORT_COLUMNS.find((column) => column === value) ?? null
}

export function formatDailyRate(dailyRate: number | null) {
  return formatValue(dailyRate, ` ${CONFIG.currencySymbol}`)
}

export function isAboveReference(dailyRate: number | null, reference: number) {
  return dailyRate !== null && dailyRate >= reference
}

// Built per call so the labels follow the active locale.
export const ONSITE_DAYS_OPTIONS = () =>
  Array.from({ length: 6 }, (_, days) => ({
    id: String(days),
    name: days === 0 ? m.opportunity_fullRemote() : m.opportunity_onsiteDaysValue({ days })
  }))

// Ratios rather than counts, so both stay meaningful if NOTES_MAX_LENGTH moves.
const NOTES_WARNING_RATIO = 0.2
const NOTES_DANGER_RATIO = 0.05

export function notesRemaining(notes: string) {
  return NOTES_MAX_LENGTH - notes.length
}

export function notesRemainingHint(remaining: number) {
  return remaining <= 0
    ? m.opportunity_notesRemainingZero()
    : m.opportunity_notesRemaining({ count: remaining })
}

// See docs/reference/opportunity-form.md
export function notesRemainingTone(remaining: number) {
  if (remaining <= NOTES_MAX_LENGTH * NOTES_DANGER_RATIO) {
    return 'text-destructive'
  }

  return remaining <= NOTES_MAX_LENGTH * NOTES_WARNING_RATIO ? 'text-warning' : undefined
}

export function opportunityLabel(row: OpportunityRow) {
  const contact = primaryContact(row.contacts)

  return (
    (contact && contactDisplayName(contact)) ||
    row.need ||
    row.esn ||
    row.endClient ||
    m.opportunity_untitled()
  )
}
