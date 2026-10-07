import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'
import { linkedContactIdsSchema } from '@/modules/contacts/contacts-schema'
import { toNumeric, toOptionalText } from '@/modules/opportunities/utils/form-values'
import { tableQuerySchema, tableSearchSchema } from '@/shared/table/table-schema'

// See docs/reference/data-model.md for the nullable + optional rule
const nullableText = z.string().trim().nullable().optional()

export const NOTES_MAX_LENGTH = 500

export const opportunityFieldsSchema = z.object({
  stageId: z.uuid({ error: () => m.validation_stageRequired() }),
  jobTypeId: z.uuid().nullable().optional(),
  experienceId: z.uuid().nullable().optional(),
  contactIds: linkedContactIdsSchema.optional(),
  esn: nullableText,
  endClient: nullableText,
  need: nullableText,
  dailyRate: z
    .int({ error: () => m.validation_dailyRateInt() })
    .min(0, { error: () => m.validation_dailyRateNegative() })
    .max(10000, { error: () => m.validation_dailyRateTooHigh() })
    .nullable()
    .optional(),
  onsiteDays: z
    .int({ error: () => m.validation_onsiteDaysInt() })
    .min(0, { error: () => m.validation_onsiteDaysNegative() })
    .max(5, { error: () => m.validation_onsiteDaysMax() })
    .nullable()
    .optional(),
  location: nullableText,
  lastContactAt: z.iso
    .date({ error: () => m.validation_dateInvalid() })
    .nullable()
    .optional(),
  nextReminderAt: z.iso
    .date({ error: () => m.validation_dateInvalid() })
    .nullable()
    .optional(),
  offerUrl: z
    .url({ error: () => m.validation_offerUrlInvalid() })
    .nullable()
    .optional(),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH, { error: () => m.validation_notesTooLong() })
    .nullable()
    .optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional()
})

// Every field is a string; the schema below converts back at the edge.
// See docs/reference/opportunity-form.md
export type OpportunityFormValues = {
  stageId: string
  jobTypeId: string | null
  experienceId: string | null
  contactIds: string[]
  esn: string
  endClient: string
  need: string
  dailyRate: string
  // A select, so it clears to null rather than to an empty string.
  onsiteDays: string | null
  location: string
  lastContactAt: string
  nextReminderAt: string
  offerUrl: string
  notes: string
}

const TEXT_FIELDS = [
  'esn',
  'endClient',
  'need',
  'location',
  'lastContactAt',
  'nextReminderAt',
  'offerUrl',
  'notes'
] as const

const NUMERIC_FIELDS = ['dailyRate', 'onsiteDays'] as const

// `z.custom` rather than a piped object schema — the variance check rejects the wider server
// input type. See docs/reference/opportunity-form.md
export const opportunityFormSchema = z
  .custom<OpportunityFormValues>()
  .transform((raw) => {
    const values: Record<string, unknown> = { ...raw }

    for (const key of TEXT_FIELDS) values[key] = toOptionalText(values[key])
    for (const key of NUMERIC_FIELDS) values[key] = toNumeric(values[key])

    return values
  })
  .pipe(opportunityFieldsSchema)

export const createOpportunitySchema = opportunityFieldsSchema

export const updateOpportunitySchema = z.object({
  id: z.uuid(),
  ...opportunityFieldsSchema.partial().shape
})

export const deleteOpportunitySchema = z.object({ id: z.uuid() })

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>

export const PAGE_SIZES: readonly number[] = [8, 10, 15] as const

// Whitelist, not a hint: the value reaches an ORDER BY.
export const SORT_COLUMNS = [
  'lastContactAt',
  'contact',
  'esn',
  'endClient',
  'dailyRate',
  'stage',
  'location'
] as const

export type SortColumn = (typeof SORT_COLUMNS)[number]

// Also feeds the route's stripSearchParams, which keeps an unfiltered URL bare.
export const OPPORTUNITIES_SEARCH_DEFAULTS = {
  tab: 'active' as const,
  q: '',
  due: false,
  sort: '',
  page: 1,
  perPage: 8
}

// Own filters + the sort/page slice every table shares. See docs/reference/table-mechanism.md
export const opportunitiesSearchSchema = z.object({
  tab: z.enum(['active', 'archived']).catch(OPPORTUNITIES_SEARCH_DEFAULTS.tab),
  q: z.string().catch(OPPORTUNITIES_SEARCH_DEFAULTS.q),
  due: z.boolean().catch(OPPORTUNITIES_SEARCH_DEFAULTS.due),
  ...tableSearchSchema({
    sortColumns: SORT_COLUMNS,
    pageSizes: PAGE_SIZES,
    defaultPerPage: OPPORTUNITIES_SEARCH_DEFAULTS.perPage
  }).shape
})

export type OpportunitiesSearch = z.infer<typeof opportunitiesSearchSchema>

export const getOpportunitiesSchema = z.object({
  tab: z.enum(['active', 'archived']),
  q: tableQuerySchema,
  due: z.boolean(),
  sortBy: z.enum(SORT_COLUMNS).nullable(),
  sortDesc: z.boolean(),
  page: z.int().min(1),
  perPage: z.int().refine((size) => PAGE_SIZES.includes(size)),
  today: z.iso.date()
})

export type GetOpportunitiesInput = z.infer<typeof getOpportunitiesSchema>

// `q` and `due` narrow the tab counts only; the KPIs stay global. See docs/reference/kpis.md
export const opportunitiesSummarySchema = z.object({
  today: z.iso.date(),
  q: tableQuerySchema.default(''),
  due: z.boolean().default(false)
})

// Aggregates that depend on the date and nothing else — "due" is relative to the browser's
// today, which is why even a search-independent count still takes a parameter.
export const todayOnlySchema = z.object({
  today: z.iso.date()
})

// Pipeline rules shared by the client calculations and their SQL counterparts. See docs/reference/kpis.md
export const STALE_THRESHOLD_DAYS = 7
