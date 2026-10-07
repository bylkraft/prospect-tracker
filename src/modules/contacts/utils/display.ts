import type {
  Contact,
  ContactRelationship,
  EmailLabel,
  PhoneLabel,
  StageColorToken
} from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { CONTACT_SORT_COLUMNS, type ContactSortColumn } from '@/modules/contacts/contacts-schema'
import { CONTACT_RELATIONSHIPS, EMAIL_LABELS, PHONE_LABELS } from '@/db/schema'
import { stageColorVar } from '@/modules/stages/stages-utils'
import type { LinkedContact } from '@/modules/contacts/contacts-types'
import { foldForSearch } from '@/modules/contacts/utils/text'

export function toContactSortColumn(value: string): ContactSortColumn | null {
  return CONTACT_SORT_COLUMNS.find((column) => column === value) ?? null
}

export function toRelationshipFilter(value: string | null): ContactRelationship | '' {
  return CONTACT_RELATIONSHIPS.find((entry) => entry === value) ?? ''
}

type Nameable = Pick<Contact, 'firstName' | 'lastName' | 'company'>

export function contactDisplayName(contact: Nameable) {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()

  return name || contact.company || ''
}

export function contactInitials(contact: Nameable) {
  const parts = [contact.firstName, contact.lastName].filter((part): part is string => !!part)
  const source = parts.length > 0 ? parts : (contact.company ?? '').split(/\s+/).filter(Boolean)

  return source
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function relationshipLabel(relationship: ContactRelationship) {
  switch (relationship) {
    case 'esn_manager':
      return m.contact_relationshipEsnManager()
    case 'end_client':
      return m.contact_relationshipEndClient()
    case 'freelance':
      return m.contact_relationshipFreelance()
    case 'other':
      return m.contact_relationshipOther()
  }
}

export function phoneLabelText(label: PhoneLabel | null) {
  if (!label) return null

  return label === 'mobile' ? m.contact_phoneLabelMobile() : m.contact_phoneLabelOffice()
}

export function emailLabelText(label: EmailLabel | null) {
  if (!label) return null

  return label === 'work' ? m.contact_emailLabelWork() : m.contact_emailLabelPersonal()
}

export const PHONE_LABEL_OPTIONS = () =>
  PHONE_LABELS.map((id) => ({ id, name: phoneLabelText(id) ?? '' }))

export const EMAIL_LABEL_OPTIONS = () =>
  EMAIL_LABELS.map((id) => ({ id, name: emailLabelText(id) ?? '' }))

export const RELATIONSHIP_OPTIONS = () =>
  CONTACT_RELATIONSHIPS.map((id) => ({
    id,
    name: relationshipLabel(id)
  }))

const RELATIONSHIP_COLOR: Record<ContactRelationship, StageColorToken> = {
  esn_manager: 'blue',
  end_client: 'green',
  freelance: 'violet',
  other: 'slate'
}

export function relationshipColorVar(relationship: ContactRelationship) {
  return stageColorVar(RELATIONSHIP_COLOR[relationship])
}

export function primaryContact(contacts: LinkedContact[]) {
  return contacts[0] ?? null
}

const DAY_MS = 24 * 60 * 60 * 1000

export function relativeDay(isoTimestamp: string, now: Date, locale: string) {
  const days = Math.round((startOfDay(new Date(isoTimestamp)) - startOfDay(now)) / DAY_MS)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (days > -7) return format.format(days, 'day')
  if (days > -30) return format.format(Math.round(days / 7), 'week')

  return format.format(Math.round(days / 30), 'month')
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function matchRange(text: string, query: string) {
  const needle = foldForSearch(query.trim())
  if (!needle) return null

  const folded = foldForSearch(text)
  if (folded.length !== text.length) return null

  const start = folded.indexOf(needle)
  return start === -1 ? null : { start, end: start + needle.length }
}
