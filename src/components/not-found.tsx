import { Link } from '@tanstack/react-router'
import { HouseIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="relative flex max-w-md flex-col items-center text-center">
        <span
          aria-hidden
          className="from-foreground/20 to-foreground/0 pointer-events-none absolute -top-36 left-1/2 -z-10 -translate-x-1/2 bg-linear-to-b bg-clip-text text-[180px] leading-none font-semibold tracking-tighter text-transparent select-none sm:-top-40 sm:text-[200px]"
        >
          404
        </span>
        <h1 className="font-heading relative text-3xl font-semibold tracking-tight sm:text-4xl">
          {m.notFound_title()}
        </h1>
        <p className="text-muted-foreground mt-2 mb-8 font-medium tracking-tight text-balance">
          {m.notFound_description()}
        </p>
        <Button variant="outline" nativeButton={false} render={<Link to={APP_ROUTES.home} />}>
          <HouseIcon />
          {m.common_backHome()}
        </Button>
      </div>
    </main>
  )
}
