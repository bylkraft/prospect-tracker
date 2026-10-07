import type { Contact, Opportunity, Stage } from '@/db/schema'
import type { LinkedContact } from '@/modules/contacts/contacts-types'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

export const FIXTURE_STAGE_ID = '11111111-1111-4111-8111-111111111111'
const FIXTURE_CONTACT_ID = '22222222-2222-4222-8222-222222222222'

export function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: 'stage-contacted',
    userId: 'user-1',
    name: 'Contacté',
    color: 'blue',
    systemKey: 'contacted',
    position: 1,
    reminderDelayDays: 7,
    isArchived: false,
    createdAt: new Date(),
    ...overrides
  }
}

export function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-1',
    userId: 'user-1',
    stageId: 'stage-contacted',
    jobTypeId: null,
    experienceId: null,
    esn: null,
    endClient: null,
    need: null,
    dailyRate: null,
    onsiteDays: null,
    location: null,
    lastContactAt: null,
    nextReminderAt: null,
    offerUrl: null,
    notes: null,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

export function makeLinkedContact(overrides: Partial<LinkedContact> = {}): LinkedContact {
  return {
    id: FIXTURE_CONTACT_ID,
    firstName: 'Camille',
    lastName: 'Ferrand',
    company: null,
    jobTitle: null,
    relationship: 'esn_manager',
    phone: null,
    ...overrides
  }
}

export function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: FIXTURE_CONTACT_ID,
    userId: 'user-1',
    firstName: 'Camille',
    lastName: 'Ferrand',
    company: null,
    jobTitle: null,
    city: null,
    emails: [],
    phones: [],
    linkedinUrl: null,
    relationship: 'esn_manager',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

export function makeRow(overrides: Partial<OpportunityRow> = {}): OpportunityRow {
  const { stage, isDue, isArchivedRow, contacts, ...opportunity } = overrides

  return {
    ...makeOpportunity({ stageId: FIXTURE_STAGE_ID, ...opportunity }),
    stage,
    isDue: isDue ?? false,
    isArchivedRow: isArchivedRow ?? false,
    contacts: contacts ?? [makeLinkedContact()]
  }
}
