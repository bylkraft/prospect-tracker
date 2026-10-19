import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { OPPORTUNITIES_SEARCH_DEFAULTS } from '@/modules/opportunities/opportunities-schema'
import { APP_ROUTES } from '@/lib/routes'

export function LandingHero() {
  const prefersReducedMotion = useReducedMotion()

  const rise = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const }
        }

  return (
    <section className="relative mx-auto max-w-[1160px] px-5 pt-10 text-center md:px-6 md:pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 -bottom-30 bg-[radial-gradient(560px_420px_at_22%_16%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_66%),radial-gradient(320px_240px_at_68%_8%,color-mix(in_oklch,var(--primary)_11%,transparent),transparent_66%)]"
      />

      <div className="relative">
        <motion.h1
          {...rise(0)}
          className="font-heading tracking-page-title mx-auto max-w-240 text-[clamp(2.125rem,5.4vw,4.125rem)] leading-[1.04] font-semibold text-balance"
        >
          {m.landing_heroTitle()}{' '}
          <span className="text-primary">{m.landing_heroTitleAccent()}</span>
        </motion.h1>

        <motion.p
          {...rise(0.09)}
          className="text-secondary-foreground mx-auto mt-6.5 max-w-160 text-lg leading-7 text-pretty"
        >
          {m.landing_heroSubtitle()}
        </motion.p>

        <motion.div {...rise(0.18)} className="mt-8 flex flex-col items-center gap-3">
          <Button
            render={<Link to={APP_ROUTES.tracker} search={OPPORTUNITIES_SEARCH_DEFAULTS} />}
            size="lg"
            className="group font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)] max-sm:w-full"
          >
            {m.landing_ctaPrimary()}
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
          <p className="text-muted-foreground text-xs">{m.landing_ctaReassurance()}</p>
        </motion.div>
      </div>
    </section>
  )
}
