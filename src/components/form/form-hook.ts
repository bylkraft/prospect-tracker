import { createFormHook } from '@tanstack/react-form'

import { fieldContext, formContext } from '@/components/form/form-context'
import { PasswordField } from '@/components/form/password-field'
import { RadioGroupField } from '@/components/form/radio-group-field'
import { SelectField } from '@/components/form/select-field'
import { EntryListField } from '@/components/form/entry-list-field'
import { SubmitButton } from '@/components/form/submit-button'
import { TextInputField } from '@/components/form/text-input-field'
import { TextareaField } from '@/components/form/textarea-field'

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextInputField,
    SelectField,
    EntryListField,
    TextareaField,
    RadioGroupField,
    PasswordField
  },
  formComponents: { SubmitButton }
})
