import { m } from '@/i18n/paraglide/messages'
import { parseSort } from '@/shared/table/table-utils'

// Here rather than in the schema, which imports this file: the reverse import made a cycle.
export const VIEWS = ['list', 'kanban'] as const

export type View = (typeof VIEWS)[number]

export function isView(value: string): value is View {
  return (VIEWS as readonly string[]).includes(value)
}

// One vocabulary for both views: `hidden=esn` means the same thing whichever one is on screen, so
// switching view keeps the choice instead of resetting it. See docs/reference/kanban-view.md
export const HIDABLE_FIELDS = [
  'lastContactAt',
  'esn',
  'endClient',
  'dailyRate',
  'location'
] as const

export type HidableField = (typeof HIDABLE_FIELDS)[number]

// What each view actually draws — see docs/reference/kanban-view.md
const FIELDS_BY_VIEW: Record<View, readonly HidableField[]> = {
  list: HIDABLE_FIELDS,
  kanban: ['lastContactAt', 'esn', 'endClient', 'dailyRate']
}

export function hidableFieldsFor(view: View) {
  return FIELDS_BY_VIEW[view]
}

function isHidableField(value: string): value is HidableField {
  return (HIDABLE_FIELDS as readonly string[]).includes(value)
}

// Built per call so the labels follow the active locale.
export const fieldLabels = (): Record<HidableField, string> => ({
  lastContactAt: m.table_colLastContact(),
  esn: m.table_colEsn(),
  endClient: m.table_colEndClient(),
  dailyRate: m.table_colDailyRate(),
  location: m.table_colLocation()
})

// Hidden rather than visible fields: the default is everything on, so an untouched setting stores
// nothing and a field added later shows up without a migration.
export function parseHiddenFields(raw: string): HidableField[] {
  return raw.split(',').filter(isHidableField)
}

export function serializeHiddenFields(hidden: readonly HidableField[]) {
  return HIDABLE_FIELDS.filter((field) => hidden.includes(field)).join(',')
}

export function toggleHiddenField(hidden: readonly HidableField[], field: HidableField) {
  return hidden.includes(field) ? hidden.filter((entry) => entry !== field) : [...hidden, field]
}

// Hiding the sorted column takes its header, the only control that could clear the sort.
export function sortsOnHidden(sort: string, hidden: readonly HidableField[]) {
  const sortedId = parseSort(sort)[0]?.id
  return hidden.some((field) => field === sortedId)
}
