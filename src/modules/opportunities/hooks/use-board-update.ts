import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import { updateOpportunity, type Board } from '@/modules/opportunities/opportunities-server'
import { boardQueryOptions } from '@/modules/opportunities/hooks/use-board'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'
import { isTerminalStage, withPatchedRow } from '@/modules/opportunities/utils/board'
import type { Stage } from '@/db/schema'
import type { GetBoardInput } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Update = { id: string; stageId?: string; isPinned?: boolean; isDue?: boolean }

const BOARD_UPDATE_KEY = [...OPPORTUNITIES_QUERY_KEY, 'board-update']

// Optimistic moves and pins, rolled back one card at a time — see docs/reference/kanban-view.md
export function useBoardUpdate(input: GetBoardInput, stages: Stage[]) {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()
  const { queryKey } = boardQueryOptions(input)

  const mutation = useMutation({
    mutationKey: BOARD_UPDATE_KEY,
    mutationFn: ({ id, stageId, isPinned }: Update) =>
      updateOpportunity({ data: { id, stageId, isPinned } }),

    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey })
      const board = queryClient.getQueryData<Board>(queryKey)
      const previous = board?.rows.find((row) => row.id === id)

      if (board) {
        const rows = withPatchedRow(board.rows, id, patch, new Date())
        // Off a due-only board or the archived tab — see docs/reference/kanban-view.md
        const leaves = (row: (typeof rows)[number]) =>
          (input.due && !row.isDue) ||
          (input.tab === 'archived' && patch.stageId !== undefined && !row.isArchived)
        const kept = rows.filter((row) => row.id !== id || !leaves(row))

        queryClient.setQueryData<Board>(queryKey, { ...board, rows: kept })
      }

      // The board this write was made on, not the latest render's — see docs/reference/kanban-view.md
      return { previous, queryKey }
    },

    // Only this row goes back — see docs/reference/kanban-view.md
    onError: (error, { id }, context) => {
      if (context?.previous) {
        const { previous } = context
        queryClient.setQueryData<Board>(
          context.queryKey,
          (board) =>
            board && {
              ...board,
              rows: board.rows.some((row) => row.id === id)
                ? board.rows.map((row) => (row.id === id ? previous : row))
                : [...board.rows, previous]
            }
        )
      }
      showErrorToast(error, { title: m.opportunity_updateFailed() })
    },

    // After the last write only, through the parent key — see docs/reference/kanban-view.md
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: BOARD_UPDATE_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })
      }
    }
  })

  return {
    move: (row: OpportunityRow, stageId: string) => {
      const stage = stages.find((entry) => entry.id === stageId)
      // An outcome is never due; any other change to isDue waits for SQL.
      const settlesDue = stage !== undefined && isTerminalStage(stage)

      mutation.mutate({ id: row.id, stageId, ...(settlesDue && { isDue: false }) })
    },
    togglePin: (row: OpportunityRow) => mutation.mutate({ id: row.id, isPinned: !row.isPinned })
  }
}
