import { queryOptions, useQuery } from '@tanstack/react-query'

import { getBoard } from '@/modules/opportunities/opportunities-server'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'
import type { GetBoardInput } from '@/modules/opportunities/opportunities-schema'

// Under the opportunities key, so any opportunity write refreshes the board through the parent.
export const boardQueryOptions = (input: GetBoardInput) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'board', input],
    queryFn: () => getBoard({ data: input }),

    // Keeps the columns on screen while a filter change refetches, as the table does when paging.
    placeholderData: (previous) => previous
  })

export function useBoard(input: GetBoardInput) {
  return useQuery(boardQueryOptions(input))
}
