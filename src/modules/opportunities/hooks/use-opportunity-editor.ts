import { useCallback, useState } from 'react'

import type { CreateOpportunityInput } from '@/modules/opportunities/opportunities-schema'
import { useOpportunityMutations } from '@/modules/opportunities/hooks/use-opportunity-mutations'
import type { LinkedContact } from '@/modules/contacts/contacts-types'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type EditorState = { row: OpportunityRow | null; seedContact?: LinkedContact } | null

export function useOpportunityEditor() {
  const [editor, setEditor] = useState<EditorState>(null)
  const [deleting, setDeleting] = useState<OpportunityRow | null>(null)
  const { create, update, remove } = useOpportunityMutations()

  const openCreate = useCallback(() => setEditor({ row: null }), [])
  const openCreateForContact = useCallback(
    (seedContact: LinkedContact) => setEditor({ row: null, seedContact }),
    []
  )
  const openEdit = useCallback((row: OpportunityRow) => setEditor({ row }), [])
  const closeEditor = useCallback(() => setEditor(null), [])

  const submit = useCallback(
    async (values: CreateOpportunityInput) => {
      const editing = editor?.row

      // Rethrows on purpose: the sheet stays open with whatever was typed, toast via onError.
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...values })
      } else {
        await create.mutateAsync(values)
      }

      setEditor(null)
    },
    [create, editor, update]
  )

  const toggleArchive = useCallback(
    (row: OpportunityRow) => update.mutate({ id: row.id, isArchived: !row.isArchived }),
    [update]
  )

  const togglePin = useCallback(
    (row: OpportunityRow) => update.mutate({ id: row.id, isPinned: !row.isPinned }),
    [update]
  )

  const confirmDelete = useCallback(async () => {
    if (!deleting) return

    try {
      await remove.mutateAsync(deleting.id)
      setDeleting(null)
      setEditor(null)
    } catch {
      // Handled by the mutation's onError.
    }
  }, [deleting, remove])

  return {
    editor,
    deleting,
    isDeleting: remove.isPending,
    openCreate,
    openCreateForContact,
    openEdit,
    closeEditor,
    submit,
    toggleArchive,
    togglePin,
    requestDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    confirmDelete
  }
}
