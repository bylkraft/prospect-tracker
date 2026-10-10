import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { AppShell } from '@/components/layout/app-shell'
import { PREFERENCE_COOKIES, readPreference } from '@/lib/preferences'
import { APP_ROUTES } from '@/lib/routes'
import { provisionUser } from '@/modules/auth/auth-server'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const user = context.user

    if (!user) {
      throw redirect({ to: APP_ROUTES.login, search: { redirect: location.href } })
    }

    if (user.provisioned) return { user }

    // provisionUser refreshes the token, so the next navigation reads the flipped claim.
    await provisionUser()
    return { user: { ...user, provisioned: true } }
  },
  loader: () => ({ sidebarOpen: readPreference(PREFERENCE_COOKIES.sidebar) !== 'false' }),
  component: AuthedLayout
})

function AuthedLayout() {
  const { sidebarOpen } = Route.useLoaderData()

  return (
    <AppShell defaultSidebarOpen={sidebarOpen}>
      <Outlet />
    </AppShell>
  )
}
