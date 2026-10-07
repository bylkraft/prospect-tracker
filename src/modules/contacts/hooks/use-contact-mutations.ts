import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import type { CreateContactInput, UpdateContactInput } from '@/modules/contacts/contacts-schema'
import { createContact, deleteContact, updateContact } from '@/modules/contacts/contacts-server'
import { CONTACTS_QUERY_KEY } from '@/modules/contacts/hooks/use-contacts'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'

export function useContactMutations() {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
    void queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })
  }

  const create = useMutation({
    mutationFn: (data: CreateContactInput) => createContact({ data }),
    onSettled: invalidateAll,
    onError: (error) => showErrorToast(error, { title: m.contact_createFailed() })
  })

  const update = useMutation({
    mutationFn: (data: UpdateContactInput) => updateContact({ data }),
    onSettled: invalidateAll,
    onError: (error) => showErrorToast(error, { title: m.contact_updateFailed() })
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteContact({ data: { id } }),
    onSettled: invalidateAll,
    onError: (error) => showErrorToast(error, { title: m.contact_deleteFailed() })
  })

  return { create, update, remove }
}
