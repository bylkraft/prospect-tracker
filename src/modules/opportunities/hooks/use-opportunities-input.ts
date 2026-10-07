import { useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.tracker'
import { useToday } from '@/hooks/use-today'
import { toOpportunitiesInput } from '@/modules/opportunities/utils/search-input'
import type { GetOpportunitiesInput } from '@/modules/opportunities/opportunities-schema'

// See docs/reference/server-side-table.md
export function useOpportunitiesInput(): GetOpportunitiesInput {
  return toOpportunitiesInput(useSearch({ from: Route.id }), useToday())
}
