import { createContext, use, useState, type PropsWithChildren } from 'react'

import type { LinkedContact } from '@/modules/contacts/contacts-types'
import { ContactSheet } from '@/modules/contacts/components/contact-sheet'
import { useContactEditor } from '@/modules/contacts/hooks/use-contact-editor'
import { useKnownContacts } from '@/modules/contacts/hooks/use-known-contacts'
import { DeleteOpportunityDialog } from '@/modules/opportunities/components/delete-opportunity-dialog'
import { OpportunitySheet } from '@/modules/opportunities/components/opportunity-sheet'
import { useExperienceLevels } from '@/modules/experience-levels/hooks/use-experience-levels'
import { useJobTypes } from '@/modules/job-types/hooks/use-job-types'
import { opportunityLabel } from '@/modules/opportunities/utils/display'
import { useOpportunityEditor } from '@/modules/opportunities/hooks/use-opportunity-editor'
import { useStages } from '@/modules/stages/hooks/use-stages'

type OpportunityEditor = ReturnType<typeof useOpportunityEditor>

const OpportunityEditorContext = createContext<OpportunityEditor | null>(null)

const ContactCreateContext = createContext<(() => void) | null>(null)

const LinkOpportunityContext = createContext<((contact: LinkedContact) => void) | null>(null)

// See docs/reference/opportunity-form.md
export function OpportunityEditorProvider({ children }: PropsWithChildren) {
  const editor = useOpportunityEditor()
  const { knownContacts, remember } = useKnownContacts([
    ...(editor.editor?.row?.contacts ?? []),
    ...(editor.editor?.seedContact ? [editor.editor.seedContact] : [])
  ])
  const contactEditor = useContactEditor()
  const { data: stages } = useStages()
  const { data: jobTypes } = useJobTypes()
  const { data: experienceLevels } = useExperienceLevels()
  // Kept so the title survives the dialog's exit animation.
  const [lastDeletingLabel, setLastDeletingLabel] = useState('')
  const deletingLabel = editor.deleting ? opportunityLabel(editor.deleting) : ''

  if (deletingLabel && deletingLabel !== lastDeletingLabel) {
    setLastDeletingLabel(deletingLabel)
  }

  return (
    <OpportunityEditorContext value={editor}>
      <ContactCreateContext value={contactEditor.openCreate}>
        <LinkOpportunityContext value={editor.openCreateForContact}>
          {children}
        </LinkOpportunityContext>
      </ContactCreateContext>

      {stages ? (
        <OpportunitySheet
          open={editor.editor !== null}
          onOpenChange={(next) => {
            if (!next) editor.closeEditor()
          }}
          row={editor.editor?.row ?? null}
          seedContact={editor.editor?.seedContact ?? null}
          stages={stages}
          jobTypes={jobTypes ?? []}
          experienceLevels={experienceLevels ?? []}
          knownContacts={knownContacts}
          onRememberContact={remember}
          onSubmit={editor.submit}
          onDelete={(row) => {
            editor.closeEditor()
            editor.requestDelete(row)
          }}
        />
      ) : null}

      <ContactSheet
        open={contactEditor.editor !== null}
        onOpenChange={(next) => {
          if (!next) contactEditor.closeEditor()
        }}
        contact={null}
        onSubmit={async (values) => void (await contactEditor.submit(values))}
      />

      <DeleteOpportunityDialog
        open={editor.deleting !== null}
        onOpenChange={(next) => {
          if (!next) editor.cancelDelete()
        }}
        label={deletingLabel || lastDeletingLabel}
        isPending={editor.isDeleting}
        onConfirm={() => void editor.confirmDelete()}
      />
    </OpportunityEditorContext>
  )
}

export function useOpportunityEditorContext() {
  const editor = use(OpportunityEditorContext)

  if (!editor) throw new Error('useOpportunityEditorContext must be used within the provider')

  return editor
}

export function useLinkOpportunityContext() {
  const openCreate = use(LinkOpportunityContext)

  if (!openCreate) throw new Error('useLinkOpportunityContext must be used within the provider')

  return openCreate
}

export function useContactCreateContext() {
  const openCreate = use(ContactCreateContext)

  if (!openCreate) throw new Error('useContactCreateContext must be used within the provider')

  return openCreate
}
