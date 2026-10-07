import { useCallback, useState } from 'react'

import type { Contact } from '@/db/schema'
import type { CreateContactInput } from '@/modules/contacts/contacts-schema'
import { useContactMutations } from '@/modules/contacts/hooks/use-contact-mutations'
import type { ContactDraft } from '@/modules/contacts/utils/form-values'

type EditorState = { contact: Contact | null; draft?: ContactDraft } | null

export function useContactEditor() {
  const [editor, setEditor] = useState<EditorState>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const { create, update, remove } = useContactMutations()

  const openCreate = useCallback((draft?: ContactDraft) => setEditor({ contact: null, draft }), [])
  const openEdit = useCallback((contact: Contact) => setEditor({ contact }), [])
  const closeEditor = useCallback(() => setEditor(null), [])

  const submit = useCallback(
    async (values: CreateContactInput) => {
      const editing = editor?.contact

      const saved = editing
        ? await update.mutateAsync({ id: editing.id, ...values })
        : await create.mutateAsync(values)

      setEditor(null)

      return saved
    },
    [create, editor, update]
  )

  const confirmDelete = useCallback(async () => {
    if (!deleting) return false

    try {
      await remove.mutateAsync(deleting.id)
      setDeleting(null)
      setEditor(null)
      return true
    } catch {
      return false
    }
  }, [deleting, remove])

  return {
    editor,
    deleting,
    isDeleting: remove.isPending,
    openCreate,
    openEdit,
    closeEditor,
    submit,
    requestDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    confirmDelete
  }
}
