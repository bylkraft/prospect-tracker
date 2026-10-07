import { FormField } from '@/components/form/form-field'
import { useFieldContext } from '@/components/form/form-context'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  label: string
  placeholder?: string
  rows?: number
  hint?: string
  hintClassName?: string
  maxLength?: number
  className?: string
}

export function TextareaField({
  label,
  placeholder,
  rows = 4,
  hint,
  hintClassName,
  maxLength,
  className
}: Props) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <FormField
      label={label}
      hint={hint}
      hintClassName={hintClassName}
      className={className}
      labelSuffix={
        maxLength ? (
          <span className="text-muted-foreground text-xs tabular-nums">
            {field.state.value.length} / {maxLength}
          </span>
        ) : null
      }
    >
      <Textarea
        id={field.name}
        rows={rows}
        maxLength={maxLength}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
      />
    </FormField>
  )
}
