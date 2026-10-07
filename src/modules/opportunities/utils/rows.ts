import type { Opportunity, Stage } from '@/db/schema'
import type { LinkedContact } from '@/modules/contacts/contacts-types'
import type { StageIndex } from '@/modules/stages/stages-utils'

// Computed by SQL, never recomputed here — see docs/reference/data-model.md
export type OpportunityDueFlags = Opportunity & {
  isDue: boolean
  isArchivedRow: boolean
  contacts: LinkedContact[]
}

export type OpportunityRow = OpportunityDueFlags & {
  stage: Stage | undefined
}

export type StatusTab = 'active' | 'archived'

export function isStatusTab(value: string | undefined): value is StatusTab {
  return value === 'active' || value === 'archived'
}

export function toRows(
  opportunities: OpportunityDueFlags[],
  stageIndex: StageIndex
): OpportunityRow[] {
  return opportunities.map((opportunity) => ({
    ...opportunity,
    stage: stageIndex.get(opportunity.stageId)
  }))
}
