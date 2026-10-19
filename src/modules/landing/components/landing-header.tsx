import { Link } from '@tanstack/react-router'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll
} from 'motion/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { BrandMark } from '@/components/icons/brand-mark'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { CONFIG } from '@/lib/config'
import { cn } from '@/lib/utils'
import { OPPORTUNITIES_SEARCH_DEFAULTS } from '@/modules/opportunities/opportunities-schema'
import { APP_ROUTES } from '@/lib/routes'

const NAV_LINKS = [
  { href: '#demo', label: () => m.landing_navDemo() },
  { href: '#fonctionnalites', label: () => m.landing_navFeatures() },
  { href: '#relances', label: () => m.landing_navReminders() }
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const { scrollY } = useScroll()

  // The bar is a floating pill: invisible at the top, it gains its surface once the page moves.
  useMotionValueEvent(scrollY, 'change', (latest) => setScrolled(latest > 8))

  return (
    <header className="sticky top-0 z-30 px-5 py-3.5 md:px-6">
      <div
        className={cn(
          'mx-auto flex h-16 max-w-[1160px] items-center gap-4 rounded-2xl border px-3.5 transition-[background-color,box-shadow,border-color] duration-240',
          scrolled
            ? 'border-border bg-[color-mix(in_oklch,var(--card)_82%,transparent)] shadow-[0_10px_30px_-18px_color-mix(in_oklch,var(--foreground)_30%,transparent)] backdrop-blur-md'
            : 'border-transparent'
        )}
      >
        <Link to={APP_ROUTES.home} className="flex flex-none items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-9 flex-none items-center justify-center rounded-lg">
            <BrandMark className="size-8.5" />
          </span>
          <span className="text-foreground font-heading tracking-title text-lg font-semibold">
            {CONFIG.brand}
          </span>
        </Link>

        <nav className="ml-2.5 flex items-center gap-0.5 max-lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-secondary-foreground hover:bg-muted hover:text-foreground flex h-9.5 items-center rounded-lg px-3 font-medium transition-colors"
            >
              {link.label()}
            </a>
          ))}
        </nav>

        <span className="flex-1" />

        <div className="flex flex-none items-center gap-2.25">
          <LocaleSwitcher className="max-sm:hidden" />
          <Button
            render={<Link to={APP_ROUTES.tracker} search={OPPORTUNITIES_SEARCH_DEFAULTS} />}
            size="md"
            className="font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)] max-sm:hidden"
          >
            {m.landing_ctaPrimary()}
          </Button>
          <Button
            variant="outline"
            size="icon-md"
            aria-label={m.landing_navMenu()}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="lg:hidden"
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="border-border-soft overflow-hidden border-t lg:hidden"
          >
            <nav className="mx-auto flex max-w-[1160px] flex-col gap-0.5 px-5 py-3 md:px-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-secondary-foreground hover:bg-muted hover:text-foreground flex h-11 items-center rounded-lg px-3 font-medium transition-colors"
                >
                  {link.label()}
                </a>
              ))}
              <Link
                to={APP_ROUTES.login}
                search={{ mode: 'signin' }}
                onClick={() => setOpen(false)}
                className="text-foreground border-border-soft hover:bg-muted mt-1 flex h-11 items-center rounded-lg border-t px-3 font-medium transition-colors"
              >
                {m.landing_signIn()}
              </Link>
              <Button
                render={<Link to={APP_ROUTES.tracker} search={OPPORTUNITIES_SEARCH_DEFAULTS} />}
                size="md"
                className="mt-2 font-semibold sm:hidden"
                onClick={() => setOpen(false)}
              >
                {m.landing_ctaPrimary()}
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
