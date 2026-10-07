import { useCallback, useState } from 'react'

import type { LinkedContact } from '@/modules/contacts/contacts-types'

export function useKnownContacts(seed: LinkedContact[]) {
  const [added, setAdded] = useState<LinkedContact[]>([])

  const remember = useCallback((contact: LinkedContact) => {
    setAdded((current) =>
      current.some((entry) => entry.id === contact.id) ? current : [...current, contact]
    )
  }, [])

  const byId = new Map<string, LinkedContact>()
  for (const contact of [...seed, ...added]) byId.set(contact.id, contact)

  return { knownContacts: [...byId.values()], remember }
}
