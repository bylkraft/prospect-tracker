import { withForm } from '@/components/form/form-hook'
import { SheetFormSection } from '@/components/sheet-form'
import { m } from '@/i18n/paraglide/messages'
import type { LinkedContact } from '@/modules/contacts/contacts-types'
import { LinkedContactsField } from '@/modules/contacts/components/linked-contacts-field'
import {
  EMPTY_FORM_VALUES,
  FULL_WIDTH,
  GRID
} from '@/modules/opportunities/components/sheet/form-layout'

export const ContactSection = withForm({
  defaultValues: EMPTY_FORM_VALUES,
  props: {
    linkedContacts: [] as LinkedContact[],
    onCreateContact: (_term: string) => {},
    onLinkContact: (_contact: LinkedContact) => {}
  },
  render: function Render({ form, linkedContacts, onCreateContact, onLinkContact }) {
    return (
      <SheetFormSection title={m.contact_sectionContacts()}>
        <form.AppField name="contactIds">
          {(field) => (
            <LinkedContactsField
              contacts={linkedContacts}
              onLink={onLinkContact}
              onUnlink={(contactId) =>
                field.handleChange(field.state.value.filter((id) => id !== contactId))
              }
              onReorder={(contactIds) => field.handleChange(contactIds)}
              onCreateNew={onCreateContact}
            />
          )}
        </form.AppField>

        <div className={GRID}>
          <form.AppField name="esn">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_esnLabel()}
                placeholder={m.opportunity_esnPlaceholder()}
              />
            )}
          </form.AppField>

          <form.AppField name="endClient">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_endClientLabel()}
                placeholder={m.opportunity_endClientPlaceholder()}
              />
            )}
          </form.AppField>

          <form.AppField name="offerUrl">
            {(field) => (
              <field.TextInputField
                size="form"
                label={m.opportunity_offerUrlLabel()}
                placeholder={m.opportunity_offerUrlPlaceholder()}
                type="url"
                className={FULL_WIDTH}
              />
            )}
          </form.AppField>
        </div>
      </SheetFormSection>
    )
  }
})
