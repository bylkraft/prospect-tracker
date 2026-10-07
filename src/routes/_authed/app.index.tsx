import { createFileRoute, redirect } from '@tanstack/react-router'

import { APP_ROUTES } from '@/lib/routes'

export const Route = createFileRoute('/_authed/app/')({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `${APP_ROUTES.tracker}${location.searchStr}`, replace: true })
  }
})
