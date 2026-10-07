import { createFileRoute } from '@tanstack/react-router'

import { APP_ROUTES } from '@/lib/routes'
import { toSafeRedirect } from '@/modules/auth/utils/user'
import { getSupabaseServerClient } from '@/lib/supabase/server'

function redirectTo(origin: string, path: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: new URL(path, origin).toString() }
  })
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const action = url.pathname.split('/').pop()

        if (action === 'callback') {
          const code = url.searchParams.get('code')
          const next = toSafeRedirect(url.searchParams.get('next'), APP_ROUTES.tracker)

          if (code) {
            const supabase = getSupabaseServerClient()
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
              return redirectTo(url.origin, next)
            }
          }
          return redirectTo(url.origin, `${APP_ROUTES.login}?error=oauth`)
        }

        if (action === 'logout') {
          const supabase = getSupabaseServerClient()
          await supabase.auth.signOut()
          return redirectTo(url.origin, APP_ROUTES.login)
        }

        return new Response('Not found', { status: 404 })
      }
    }
  }
})
