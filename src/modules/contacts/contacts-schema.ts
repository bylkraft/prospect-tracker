import { z } from 'zod/v4'

import {
  CONTACT_RELATIONSHIPS,
  EMAIL_LABELS,
  PHONE_LABELS,
  type ContactEmail,
  type ContactPhone
} from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { toOptionalText } from '@/modules/opportunities/utils/form-values'
import { tableQuerySchema, tableSearchSchema } from '@/shared/table/table-schema'

const nullableText = z.string().trim().nullable().optional()

export const CONTACT_NOTES_MAX_LENGTH = 500

export const MAX_EMAILS = 5
export const MAX_PHONES = 5

const entryList = <T extends readonly [string, ...string[]]>(
  value: z.ZodType<string>,
  labels: T,
  max: number
) =>
  z
    .array(z.object({ value, label: z.enum(labels).nullable().default(null) }))
    .max(max)
    .default([])

const emailList = entryList(
  z.email({ error: () => m.validation_contactEmailInvalid() }).trim(),
  EMAIL_LABELS,
  MAX_EMAILS
)

const phoneList = entryList(
  z
    .string()
    .trim()
    .min(1)
    .max(30, { error: () => m.validation_phoneTooLong() }),
  PHONE_LABELS,
  MAX_PHONES
)

const contactFields = z.object({
  firstName: nullableText,
  lastName: nullableText,
  company: nullableText,
  jobTitle: nullableText,
  city: nullableText,
  emails: emailList,
  phones: phoneList,
  linkedinUrl: z
    .url({ error: () => m.validation_linkedinInvalid() })
    .nullable()
    .optional(),
  relationship: z.enum(CONTACT_RELATIONSHIPS).default('other'),
  notes: z
    .string()
    .trim()
    .max(CONTACT_NOTES_MAX_LENGTH, { error: () => m.validation_notesTooLong() })
    .nullable()
    .optional()
})

export const isIdentified = (values: {
  firstName?: string | null
  lastName?: string | null
  company?: string | null
}) => Boolean(values.firstName || values.lastName || values.company)

const identityError = (path: 'firstName' | 'lastName') => ({
  error: () => m.validation_contactIdentityRequired(),
  path: [path]
})

export const createContactSchema = contactFields
  .refine(isIdentified, identityError('lastName'))
  .refine(isIdentified, identityError('firstName'))

export type ContactFormValues = {
  firstName: string
  lastName: string
  company: string
  jobTitle: string
  city: string
  emails: ContactEmail[]
  phones: ContactPhone[]
  linkedinUrl: string
  relationship: string
  notes: string
}

const TEXT_FIELDS = [
  'firstName',
  'lastName',
  'company',
  'jobTitle',
  'city',
  'linkedinUrl',
  'notes'
] as const
const LIST_FIELDS = ['emails', 'phones'] as const

export const contactFormSchema = z
  .custom<ContactFormValues>()
  .transform((raw) => {
    const values: Record<string, unknown> = { ...raw }

    for (const key of TEXT_FIELDS) values[key] = toOptionalText(values[key])
    for (const key of LIST_FIELDS) {
      const list = values[key]
      values[key] = Array.isArray(list)
        ? list
            .map((entry) => ({ ...entry, value: entry.value.trim() }))
            .filter((entry) => entry.value !== '')
        : []
    }

    return values
  })
  .pipe(createContactSchema)

// Without its defaults: `.partial()` keeps them, and an id-only patch would wipe the lists.
const patchFields = contactFields.partial().extend({
  emails: emailList.unwrap().optional(),
  phones: phoneList.unwrap().optional(),
  relationship: z.enum(CONTACT_RELATIONSHIPS).optional()
})

export const updateContactSchema = z.object({ id: z.uuid(), ...patchFields.shape })

export const deleteContactSchema = z.object({ id: z.uuid() })

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>

export const CONTACTS_PAGE_SIZES: readonly number[] = [10, 15, 25] as const

export const CONTACT_SORT_COLUMNS = ['name', 'lastExchange', 'opportunities'] as const

export type ContactSortColumn = (typeof CONTACT_SORT_COLUMNS)[number]

export const CONTACTS_SEARCH_DEFAULTS = {
  q: '',
  relationship: '' as const,
  sort: '',
  page: 1,
  perPage: 10
}

export const contactsSearchSchema = z.object({
  q: z.string().catch(CONTACTS_SEARCH_DEFAULTS.q),
  relationship: z.enum(['', ...CONTACT_RELATIONSHIPS]).catch(CONTACTS_SEARCH_DEFAULTS.relationship),
  ...tableSearchSchema({
    sortColumns: CONTACT_SORT_COLUMNS,
    pageSizes: CONTACTS_PAGE_SIZES,
    defaultPerPage: CONTACTS_SEARCH_DEFAULTS.perPage
  }).shape
})

export type ContactsSearch = z.infer<typeof contactsSearchSchema>

export const getContactsSchema = z.object({
  q: tableQuerySchema,
  relationship: z.enum(['', ...CONTACT_RELATIONSHIPS]),
  sortBy: z.enum(CONTACT_SORT_COLUMNS).nullable(),
  sortDesc: z.boolean(),
  page: z.int().min(1),
  perPage: z.int().refine((size) => CONTACTS_PAGE_SIZES.includes(size))
})

export type GetContactsInput = z.infer<typeof getContactsSchema>

export const contactDetailSchema = z.object({ id: z.uuid() })

export const MAX_LINKED_CONTACTS = 20

export const linkedContactIdsSchema = z
  .array(z.uuid())
  .max(MAX_LINKED_CONTACTS)
  .refine((ids) => new Set(ids).size === ids.length, {
    error: () => m.validation_contactDuplicateLink()
  })

export const searchContactsSchema = z.object({
  q: tableQuerySchema,
  excludeIds: z.array(z.uuid()).max(MAX_LINKED_CONTACTS).default([])
})
