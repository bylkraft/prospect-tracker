import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  SheetFormBody,
  SheetFormDiscardDialog,
  SheetFormFooter,
  SheetFormHeader
} from '@/components/sheet-form'
import type { ExperienceLevel, JobType, Stage } from '@/db/schema'
import { ContactSheet } from '@/modules/contacts/components/contact-sheet'
import { toLinkedContact, type LinkedContact } from '@/modules/contacts/contacts-types'
import { useContactEditor } from '@/modules/contacts/hooks/use-contact-editor'
import { contactDraftFromSearch } from '@/modules/contacts/utils/form-values'
import { m } from '@/i18n/paraglide/messages'
import { ContactSection } from '@/modules/opportunities/components/sheet/contact-section'
import { MissionSection } from '@/modules/opportunities/components/sheet/mission-section'
import { TrackingSection } from '@/modules/opportunities/components/sheet/tracking-section'
import { useOpportunityForm } from '@/modules/opportunities/hooks/use-opportunity-form'
import type { opportunityFormSchema } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'
import { selectableStages } from '@/modules/stages/stages-utils'
import { Button } from '@/components/ui/button'

const FORM_ID = 'opportunity-form'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: OpportunityRow | null
  seedContact?: LinkedContact | null
  stages: Stage[]
  jobTypes: JobType[]
  experienceLevels: ExperienceLevel[]
  knownContacts: LinkedContact[]
  onRememberContact: (contact: LinkedContact) => void
  onSubmit: (values: ReturnType<typeof opportunityFormSchema.parse>) => Promise<void>
  onDelete?: (row: OpportunityRow) => void
}

export function OpportunitySheet({
  open,
  onOpenChange,
  row,
  seedContact,
  stages,
  jobTypes,
  experienceLevels,
  knownContacts,
  onRememberContact,
  onSubmit,
  onDelete
}: Props) {
  const isEdit = row !== null
  const [isConfirmingDiscard, setConfirmingDiscard] = useState(false)

  const offered = selectableStages(stages, row?.stageId)

  const contactEditor = useContactEditor()

  const { form, discard } = useOpportunityForm({
    open,
    row,
    seedContactId: seedContact?.id,
    // Both come from the same stage — the one a new opportunity starts in. Picking another stage
    // re-derives the reminder from that stage's own delay.
    fallbackStageId: offered[0]?.id ?? '',
    reminderDelayDays: offered[0]?.reminderDelayDays ?? 0,
    onSubmit
  })

  const link = (contact: LinkedContact) => {
    onRememberContact(contact)
    const current = form.state.values.contactIds
    if (current.includes(contact.id)) return
    form.setFieldValue('contactIds', [...current, contact.id])
  }

  const createContact = (term: string) => {
    const { esn, endClient } = form.state.values
    contactEditor.openCreate({
      ...contactDraftFromSearch(term),
      company: esn.trim() || endClient.trim()
    })
  }

  const requestClose = () => {
    // Same signal as the save button, so the two can never disagree — `isDirty` would latch.
    const needsConfirm = !form.state.isDefaultValue && !form.state.isSubmitting

    if (needsConfirm) setConfirmingDiscard(true)
    else onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose()
      }}
    >
      <SheetContent
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-145"
      >
        <SheetFormHeader
          icon={isEdit ? 'pencil' : 'plus'}
          title={isEdit ? m.opportunity_editTitle() : m.opportunity_createTitle()}
          description={isEdit ? m.opportunity_editDescription() : m.opportunity_createDescription()}
          onClose={requestClose}
        />

        <SheetFormBody
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit().catch(() => {})
          }}
        >
          <form.Subscribe selector={(state) => state.values.contactIds}>
            {(contactIds) => (
              <ContactSection
                form={form}
                linkedContacts={contactIds.flatMap((id) => {
                  const contact = knownContacts.find((entry) => entry.id === id)
                  return contact ? [contact] : []
                })}
                onCreateContact={createContact}
                onLinkContact={link}
              />
            )}
          </form.Subscribe>
          <MissionSection form={form} jobTypes={jobTypes} experienceLevels={experienceLevels} />
          <TrackingSection form={form} stages={offered} />
        </SheetFormBody>

        <SheetFormFooter
          destructiveCta={
            isEdit && onDelete ? (
              <Button
                variant="ghost"
                onClick={() => onDelete(row)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
              >
                <Trash2 />
                {m.common_delete()}
              </Button>
            ) : null
          }
          primaryCta={
            <form.AppForm>
              <form.SubmitButton
                formId={FORM_ID}
                requiresChanges
                label={isEdit ? m.common_save() : m.opportunity_createSubmit()}
              />
            </form.AppForm>
          }
          secondaryCta={
            <Button variant="outline" onClick={requestClose}>
              {m.common_cancel()}
            </Button>
          }
        />
      </SheetContent>

      <SheetFormDiscardDialog
        open={isConfirmingDiscard}
        onOpenChange={setConfirmingDiscard}
        title={m.opportunity_discardTitle()}
        description={m.opportunity_discardDescription()}
        confirmLabel={m.opportunity_discardConfirm()}
        onConfirm={() => {
          setConfirmingDiscard(false)
          discard()
          onOpenChange(false)
        }}
      />

      <ContactSheet
        open={contactEditor.editor !== null}
        onOpenChange={(next) => {
          if (!next) contactEditor.closeEditor()
        }}
        contact={null}
        draft={contactEditor.editor?.draft}
        note={
          contactEditor.editor?.draft?.company ? m.contact_createFromOpportunityNote() : undefined
        }
        onSubmit={async (values) => link(toLinkedContact(await contactEditor.submit(values)))}
      />
    </Sheet>
  )
}
