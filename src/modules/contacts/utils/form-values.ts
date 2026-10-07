import type { Contact, ContactEmail, ContactPhone } from '@/db/schema'
import type { ContactFormValues } from '@/modules/contacts/contacts-schema'
import { isPhoneTerm, splitFullName } from '@/modules/contacts/utils/text'

const BLANK_EMAIL: ContactEmail = { value: '', label: null }
const BLANK_PHONE: ContactPhone = { value: '', label: null }

export function toContactFormValues(contact: Contact | null): ContactFormValues {
  const text = (value: string | null | undefined) => value ?? ''

  return {
    firstName: text(contact?.firstName),
    lastName: text(contact?.lastName),
    company: text(contact?.company),
    jobTitle: text(contact?.jobTitle),
    city: text(contact?.city),
    emails: contact?.emails.length ? contact.emails.map((entry) => ({ ...entry })) : [BLANK_EMAIL],
    phones: contact?.phones.length ? contact.phones.map((entry) => ({ ...entry })) : [BLANK_PHONE],
    linkedinUrl: text(contact?.linkedinUrl),
    relationship: contact?.relationship ?? 'other',
    notes: text(contact?.notes)
  }
}

export type ContactDraft = Partial<
  Pick<ContactFormValues, 'firstName' | 'lastName' | 'company' | 'phones'>
>

export function isBlankDraft(draft: ContactDraft) {
  return (
    !draft.firstName?.trim() &&
    !draft.lastName?.trim() &&
    !draft.company?.trim() &&
    !draft.phones?.some((phone) => phone.value.trim())
  )
}

export function toContactDraftValues(draft: ContactDraft): ContactFormValues {
  return { ...toContactFormValues(null), ...draft }
}

export function contactDraftFromSearch(term: string): ContactDraft {
  const value = term.trim().replace(/\s+/g, ' ')
  if (!value) return {}
  if (isPhoneTerm(value)) return { phones: [{ value, label: null }] }

  return splitFullName(value)
}
