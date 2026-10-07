import type { Contact, ContactRelationship } from '@/db/schema'

export type LinkedContact = {
  id: string
  firstName: string | null
  lastName: string | null
  company: string | null
  jobTitle: string | null
  relationship: ContactRelationship
  phone: string | null
}

export type PickerContact = LinkedContact & {
  opportunityCount: number
  lastLinkedAt: string | null
}

export function toLinkedContact(contact: Contact): LinkedContact {
  const { id, firstName, lastName, company, jobTitle, relationship } = contact

  return {
    id,
    firstName,
    lastName,
    company,
    jobTitle,
    relationship,
    phone: contact.phones[0]?.value ?? null
  }
}
