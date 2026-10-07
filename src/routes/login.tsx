import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthForm } from '@/modules/auth/components/auth-form'
import { loginSearchSchema } from '@/modules/auth/auth-schema'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { BrandMark } from '@/components/icons/brand-mark'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { m } from '@/i18n/paraglide/messages'
import { CONFIG } from '@/lib/config'
import { APP_ROUTES } from '@/lib/routes'

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,

  beforeLoad: ({ context, search }) => {
    if (context.user) {
      throw redirect({ to: search.redirect ?? APP_ROUTES.tracker })
    }
  },

  component: LoginPage
})

function LoginPage() {
  return (
    <main className="bg-card grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="bg-muted border-border relative hidden flex-col justify-between overflow-hidden border-r p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_420px_at_22%_16%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_66%),radial-gradient(340px_280px_at_14%_10%,color-mix(in_oklch,var(--primary)_11%,transparent),transparent_70%)]"
        />

        <div className="relative flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <BrandMark className="size-8.5" />
          </div>
          <span className="text-foreground font-heading tracking-page-title text-lg font-semibold">
            {CONFIG.brand}
          </span>
        </div>

        <figure className="relative max-w-sm space-y-5">
          <blockquote className="text-2xl leading-snug font-medium text-balance italic">
            {m.auth_quote()}
          </blockquote>
          <figcaption className="text-muted-foreground">{m.auth_quoteAuthor()}</figcaption>
        </figure>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
              <BrandMark className="size-6.5" />
            </div>
            <span className="text-foreground font-heading tracking-title text-lg font-semibold">
              {CONFIG.brand}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2.25">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-16 md:px-10 md:pt-0">
          <AuthForm />
        </div>
      </div>
    </main>
  )
}
