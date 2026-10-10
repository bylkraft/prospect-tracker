import { useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.tracker'
import { useToday } from '@/hooks/use-today'
import { toBoardInput } from '@/modules/opportunities/utils/search-input'

export function useBoardInput() {
  return toBoardInput(useSearch({ from: Route.id }), useToday())
}
