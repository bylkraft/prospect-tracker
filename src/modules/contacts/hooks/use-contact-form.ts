import { useState } from 'react'

import { useAppForm } from '@/components/form/form-hook'
import { contactFormSchema } from '@/modules/contacts/contacts-schema'
import {
  isBlankDraft,
  toContactDraftValues,
  toContactFormValues,
  type ContactDraft
} from '@/modules/contacts/utils/form-values'
import type { Contact } from '@/db/schema'

type Params = {
  open: boolean
  contact: Contact | null
  draft?: ContactDraft
  onSubmit: (values: ReturnType<typeof contactFormSchema.parse>) => Promise<void>
}

export function useContactForm({ open, contact, draft = {}, onSubmit }: Params) {
  // Also the defaultValues: the form re-syncs to that option on every render.
  const baseline = contact ? toContactFormValues(contact) : toContactDraftValues(draft)

  const form = useAppForm({
    defaultValues: baseline,
    validators: { onChange: contactFormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(contactFormSchema.parse(value))

      if (!contact) form.reset(toContactFormValues(null))
    }
  })

  const load = () => form.reset(baseline)

  const opening = open ? (contact?.id ?? 'create') : false
  const [loadedOpening, setLoadedOpening] = useState<string | false>(false)

  if (opening !== loadedOpening) {
    setLoadedOpening(opening)
    if (open) load()
  }

  return {
    form,
    discard: load,
    requiresChanges: contact !== null || isBlankDraft(draft)
  }
}
