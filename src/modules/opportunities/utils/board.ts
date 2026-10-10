import { TERMINAL_STAGE_KEYS, type Stage } from '@/db/schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

// Namespaces the drag, the way STAGES_LIST_ID does for the sortable lists.
export const BOARD_ID = 'opportunities'

export type BoardColumn = {
  stage: Stage
  cards: OpportunityRow[]
}

// Every active stage, plus archived ones holding cards — see docs/reference/kanban-view.md
export function toColumns(rows: OpportunityRow[], stages: Stage[]): BoardColumn[] {
  const columns: BoardColumn[] = stages.map((stage) => ({ stage, cards: [] }))

  const byStage = new Map(columns.map((column) => [column.stage.id, column]))

  // The rows arrive pinned-first then most recent, so pushing preserves both.
  for (const row of rows) byStage.get(row.stageId)?.cards.push(row)

  return columns.filter((column) => !column.stage.isArchived || column.cards.length > 0)
}

type BoardPatch = { stageId?: string; isPinned?: boolean; isDue?: boolean }
type PatchableRow = { id: string; isPinned: boolean; updatedAt: Date } & BoardPatch

// Where the refetch will put the row: head of its pin group — see docs/reference/kanban-view.md
export function withPatchedRow<T extends PatchableRow>(
  rows: T[],
  id: string,
  patch: BoardPatch,
  now: Date
) {
  const target = rows.find((row) => row.id === id)
  if (!target) return rows

  const patched = { ...target, ...patch, updatedAt: now }
  const rest = rows.filter((row) => row.id !== id)
  const index = patched.isPinned ? 0 : rest.filter((row) => row.isPinned).length

  return [...rest.slice(0, index), patched, ...rest.slice(index)]
}

// Mirrors `isTerminal` in opportunities-sql.ts — see docs/reference/kanban-view.md
export function isTerminalStage(stage: Pick<Stage, 'systemKey'>) {
  return stage.systemKey !== null && TERMINAL_STAGE_KEYS.includes(stage.systemKey)
}
