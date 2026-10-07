import { and, eq, or, sql, type SQL } from 'drizzle-orm'

import { contacts, opportunities, opportunityContacts } from '@/db/schema'
import type { ContactSortColumn, GetContactsInput } from '@/modules/contacts/contacts-schema'
import { isPhoneTerm } from '@/modules/contacts/utils/text'

export const opportunityCount = sql<number>`(
  select count(*) from ${opportunityContacts}
  where ${opportunityContacts.contactId} = ${contacts.id}
)`

export const lastLinkedAt = sql<string | null>`(
  select max(opportunity_contacts.created_at) from ${opportunityContacts}
  where opportunity_contacts.contact_id = contacts.id
)`

export const primaryPhone = sql<string | null>`(contacts.phones -> 0 ->> 'value')`

// Table-qualified by hand: Drizzle renders bare column names here — see docs/reference/contacts.md
export const lastExchange = sql<string | null>`(
  select max(opportunities.last_contact_at)
  from ${opportunityContacts}
  join ${opportunities} on opportunities.id = opportunity_contacts.opportunity_id
  where opportunity_contacts.contact_id = contacts.id
)`

const lastOpportunity = (column: 'need' | 'esn' | 'end_client') => sql<string | null>`(
  select opportunities.${sql.raw(column)}
  from ${opportunityContacts}
  join ${opportunities} on opportunities.id = opportunity_contacts.opportunity_id
  where opportunity_contacts.contact_id = contacts.id
  order by opportunities.last_contact_at desc nulls last, opportunities.created_at desc
  limit 1
)`

export const lastOpportunityNeed = lastOpportunity('need')
export const lastOpportunityEsn = lastOpportunity('esn')
export const lastOpportunityEndClient = lastOpportunity('end_client')

export const contactDisplayNameSql = sql<string>`coalesce(nullif(btrim(concat_ws(' ', ${contacts.firstName}, ${contacts.lastName})), ''), ${contacts.company})`

export const SORT_EXPRESSIONS: Record<ContactSortColumn, SQL> = {
  name: contactDisplayNameSql,
  lastExchange,
  opportunities: opportunityCount
}

const TEXT_SEARCH_COLUMNS = [
  contacts.firstName,
  contacts.lastName,
  contacts.company,
  contacts.jobTitle,
  contacts.city
]

// Must match the `digits_only` SQL function — see docs/reference/contacts.md
function digitsOf(term: string) {
  return term.replace(/\D/g, '').replace(/^33/, '0')
}

function contactSearchMatch(q: string) {
  const terms = q.split(/\s+/).filter(Boolean)
  if (terms.length === 0) return null

  const matchesSomeColumn = (term: string) => {
    const digits = isPhoneTerm(term) ? digitsOf(term) : ''

    return or(
      ...TEXT_SEARCH_COLUMNS.map(
        (column) => sql`immutable_unaccent(${column}) ilike immutable_unaccent(${`%${term}%`})`
      ),
      sql`immutable_unaccent(public.contact_emails_text(${contacts.emails})) ilike immutable_unaccent(${`%${term}%`})`,
      ...(digits
        ? [sql`public.contact_phone_digits(${contacts.phones}) like ${`%${digits}%`}`]
        : [])
    )
  }

  return and(...terms.map(matchesSomeColumn)) ?? null
}

type ContactFilters = Pick<GetContactsInput, 'q' | 'relationship'>

export function buildContactsWhere(userId: string, { q, relationship }: ContactFilters) {
  const filters: SQL[] = [eq(contacts.userId, userId)]

  const match = contactSearchMatch(q)
  if (match) filters.push(match)

  if (relationship) filters.push(eq(contacts.relationship, relationship))

  return and(...filters)
}
