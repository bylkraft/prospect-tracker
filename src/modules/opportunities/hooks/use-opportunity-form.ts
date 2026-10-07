import { useState } from 'react'

import { useAppForm } from '@/components/form/form-hook'
import { useToday } from '@/hooks/use-today'
import { opportunityFormSchema } from '@/modules/opportunities/opportunities-schema'
import { toFormValues } from '@/modules/opportunities/utils/form-values'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Params = {
  open: boolean
  row: OpportunityRow | null
  seedContactId?: string
  fallbackStageId: string
  reminderDelayDays: number
  onSubmit: (values: ReturnType<typeof opportunityFormSchema.parse>) => Promise<void>
}

export function useOpportunityForm({
  open,
  row,
  seedContactId,
  fallbackStageId,
  reminderDelayDays,
  onSubmit
}: Params) {
  const today = useToday()

  // Every site must map identically: the save button compares the values against these defaults,
  // so a reset that disagreed with them would read as an unsaved change.
  const valuesFor = (source: OpportunityRow | null) => {
    const values = toFormValues(source, fallbackStageId, today, reminderDelayDays)

    return source || !seedContactId ? values : { ...values, contactIds: [seedContactId] }
  }

  const form = useAppForm({
    defaultValues: valuesFor(row),
    validators: { onChange: opportunityFormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(opportunityFormSchema.parse(value))

      // Only the create draft is cleared, and only once saved — a failed submit rejects above.
      if (!row) form.reset(valuesFor(null))
    }
  })

  // See docs/reference/opportunity-form.md
  const rowId = row?.id ?? seedContactId ?? null
  const [loadedRowId, setLoadedRowId] = useState(rowId)

  if (open && rowId !== loadedRowId) {
    setLoadedRowId(rowId)
    form.reset(valuesFor(row))
  }

  return {
    form,
    discard: () => form.reset(valuesFor(row))
  }
}
