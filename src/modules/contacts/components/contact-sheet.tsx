import { useState } from 'react'
import { Info, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  SheetFormBody,
  SheetFormDiscardDialog,
  SheetFormFooter,
  SheetFormHeader,
  SheetFormSection
} from '@/components/sheet-form'
import type { Contact } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import {
  CONTACT_NOTES_MAX_LENGTH,
  MAX_EMAILS,
  MAX_PHONES,
  type contactFormSchema
} from '@/modules/contacts/contacts-schema'
import { ContactOptionalSection } from '@/modules/contacts/components/contact-optional-section'
import { useContactForm } from '@/modules/contacts/hooks/use-contact-form'
import type { ContactDraft } from '@/modules/contacts/utils/form-values'
import {
  EMAIL_LABEL_OPTIONS,
  PHONE_LABEL_OPTIONS,
  RELATIONSHIP_OPTIONS
} from '@/modules/contacts/utils/display'

const FORM_ID = 'contact-form'

const GRID = 'grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  draft?: ContactDraft
  onSubmit: (values: ReturnType<typeof contactFormSchema.parse>) => Promise<void>
  onDelete?: (contact: Contact) => void
  note?: string
}

export function ContactSheet({
  open,
  onOpenChange,
  contact,
  draft,
  onSubmit,
  onDelete,
  note
}: Props) {
  const isEdit = contact !== null
  const [isConfirmingDiscard, setConfirmingDiscard] = useState(false)

  const { form, discard, requiresChanges } = useContactForm({ open, contact, draft, onSubmit })

  const requestClose = () => {
    const needsConfirm = !form.state.isDefaultValue && !form.state.isSubmitting

    if (needsConfirm) setConfirmingDiscard(true)
    else onOpenChange(false)
  }

  const emailsField = (
    <form.AppField name="emails">
      {(field) => (
        <field.EntryListField
          label={m.contact_emailsLabel()}
          placeholder={m.contact_emailPlaceholder()}
          type="email"
          addLabel={m.contact_addEmail()}
          removeLabel={m.contact_removeEmail()}
          labelOptions={EMAIL_LABEL_OPTIONS()}
          labelPlaceholder={m.contact_labelPlaceholder()}
          unlabelledLabel={m.contact_labelNone()}
          primaryLabel={m.contact_primaryEntry()}
          reorderHint={m.contact_reorderHint()}
          maxEntries={MAX_EMAILS}
        />
      )}
    </form.AppField>
  )

  const jobTitleField = (
    <form.AppField name="jobTitle">
      {(field) => (
        <field.TextInputField
          size="form"
          label={m.contact_jobTitleLabel()}
          placeholder={m.contact_jobTitlePlaceholder()}
        />
      )}
    </form.AppField>
  )

  const cityField = (
    <form.AppField name="city">
      {(field) => (
        <field.TextInputField
          size="form"
          label={m.contact_cityLabel()}
          placeholder={m.contact_cityPlaceholder()}
        />
      )}
    </form.AppField>
  )

  const linkedinField = (
    <form.AppField name="linkedinUrl">
      {(field) => (
        <field.TextInputField
          size="form"
          label={m.contact_linkedinLabel()}
          placeholder={m.contact_linkedinPlaceholder()}
          type="url"
        />
      )}
    </form.AppField>
  )

  const notesField = (
    <form.AppField name="notes">
      {(field) => (
        <field.TextareaField
          label={m.contact_notesLabel()}
          placeholder={m.contact_notesPlaceholder()}
          maxLength={CONTACT_NOTES_MAX_LENGTH}
        />
      )}
    </form.AppField>
  )

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
          icon={isEdit ? 'pencil' : 'user-plus'}
          title={isEdit ? m.contact_editTitle() : m.contact_createTitle()}
          description={isEdit ? m.contact_editDescription() : m.contact_createDescription()}
          onClose={requestClose}
        />

        <SheetFormBody
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit().catch(() => {})
          }}
        >
          {note && !isEdit ? (
            <div className="bg-secondary text-muted-foreground flex items-start gap-2.5 rounded-[10px] p-3.5 text-xs leading-relaxed">
              <Info className="mt-px size-3.75 flex-none" />
              <span>{note}</span>
            </div>
          ) : null}

          <SheetFormSection>
            <div className={GRID}>
              <form.AppField name="firstName">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_firstNameLabel()}
                    placeholder={m.contact_firstNamePlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="lastName">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_lastNameLabel()}
                    placeholder={m.contact_lastNamePlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="company">
                {(field) => (
                  <field.TextInputField
                    size="form"
                    label={m.contact_companyLabel()}
                    placeholder={m.contact_companyPlaceholder()}
                  />
                )}
              </form.AppField>

              <form.AppField name="relationship">
                {(field) => (
                  <field.SelectField
                    label={m.contact_relationshipLabel()}
                    options={RELATIONSHIP_OPTIONS()}
                    placeholder={m.contact_relationshipOther()}
                  />
                )}
              </form.AppField>

              {isEdit ? (
                <>
                  {jobTitleField}

                  {cityField}
                </>
              ) : null}
            </div>
          </SheetFormSection>

          <SheetFormSection title={m.contact_sectionReachability()}>
            <div className="flex flex-col gap-3.5">
              <form.AppField name="phones">
                {(field) => (
                  <field.EntryListField
                    label={m.contact_phonesLabel()}
                    placeholder={m.contact_phonePlaceholder()}
                    type="tel"
                    addLabel={m.contact_addPhone()}
                    removeLabel={m.contact_removePhone()}
                    labelOptions={PHONE_LABEL_OPTIONS()}
                    labelPlaceholder={m.contact_labelPlaceholder()}
                    unlabelledLabel={m.contact_labelNone()}
                    primaryLabel={m.contact_primaryEntry()}
                    reorderHint={m.contact_reorderHint()}
                    maxEntries={MAX_PHONES}
                    tabular
                  />
                )}
              </form.AppField>

              {isEdit ? (
                emailsField
              ) : (
                <ContactOptionalSection label={m.contact_emailsLabel()} hint={m.contact_none()}>
                  {emailsField}
                </ContactOptionalSection>
              )}

              {isEdit ? (
                linkedinField
              ) : (
                <ContactOptionalSection label={m.contact_moreDetails()}>
                  <div className={GRID}>
                    {jobTitleField}

                    {cityField}

                    <div className="sm:col-span-2">{linkedinField}</div>
                  </div>
                </ContactOptionalSection>
              )}

              {isEdit ? null : (
                <ContactOptionalSection label={m.contact_notesLabel()}>
                  {notesField}
                </ContactOptionalSection>
              )}
            </div>
          </SheetFormSection>

          {isEdit ? (
            <SheetFormSection title={m.contact_sectionNotes()}>{notesField}</SheetFormSection>
          ) : null}
        </SheetFormBody>

        <SheetFormFooter
          destructiveCta={
            isEdit && onDelete ? (
              <Button
                variant="ghost"
                onClick={() => onDelete(contact)}
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
                requiresChanges={requiresChanges}
                label={isEdit ? m.common_save() : m.contact_createSubmit()}
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
        title={m.contact_discardTitle()}
        description={m.contact_discardDescription()}
        confirmLabel={m.contact_discardConfirm()}
        onConfirm={() => {
          setConfirmingDiscard(false)
          discard()
          onOpenChange(false)
        }}
      />
    </Sheet>
  )
}
