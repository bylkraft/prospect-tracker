import { useNavigate } from '@tanstack/react-router'

import { APP_ROUTES } from '@/lib/routes'
import { rememberedTrackerSearch } from '@/modules/opportunities/utils/display-preferences'

// The sidebar outlives the tracker route, so it cannot read that route's search: this only ever
// navigates *to* the tracker.
export function useStartFollowUps() {
  const navigate = useNavigate()

  // Due rows only exist on the active tab.
  return () =>
    void navigate({
      to: APP_ROUTES.tracker,
      search: rememberedTrackerSearch({ tab: 'active', due: true })
    })
}
