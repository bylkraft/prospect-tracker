import { motion, useReducedMotion } from 'motion/react'
import { Bell, ChevronDown, LayoutList, Moon, Plus, SlidersHorizontal, Table2 } from 'lucide-react'

import { BrandMark } from '@/components/icons/brand-mark'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'
import { m } from '@/i18n/paraglide/messages'
import { LandingTrackerDemo } from '@/modules/landing/components/landing-tracker-demo'
import { CONFIG } from '@/lib/config'
import {
  DEMO_FOLLOW_UP_TOTAL,
  DEMO_PIPELINE,
  DEMO_TOTAL_COUNT
} from '@/modules/landing/landing-data'

// The hero's product shot: the real tracker chrome, on illustrative data.
export function LandingDemo() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section id="demo" className="relative px-5 pt-11 md:px-6">
      {/* Wider than the page grid — the real table carries nine columns. */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 34, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="ring-foreground/10 bg-card mx-auto max-w-[1290px] overflow-hidden rounded-2xl shadow-[0_30px_70px_-32px_color-mix(in_oklch,var(--foreground)_36%,transparent),0_2px_6px_-2px_color-mix(in_oklch,var(--foreground)_12%,transparent)] ring-1"
      >
        <AppHeader />

        <div className="flex">
          <Sidebar />

          {/* The real tracker, on fabricated rows — it is fully interactive. */}
          <div className="min-w-0 flex-1 p-3.5">
            <LandingTrackerDemo />
          </div>
        </div>
      </motion.div>

      <p className="text-muted-foreground mx-auto mt-4 max-w-[1160px] text-center text-xs">
        {m.landing_demoCaption()}
      </p>
    </section>
  )
}

function AppHeader() {
  return (
    <div className="border-border-soft flex h-16 items-center justify-between gap-4 border-b px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="border-border text-secondary-foreground flex size-8.5 flex-none items-center justify-center rounded-lg border">
          <Table2 className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-foreground font-heading tracking-title text-md leading-none font-semibold">
            {m.nav_tracker()}
          </span>
          <span className="text-muted-foreground text-xs leading-none tabular-nums">
            {m.dashboard_activeOpportunities({ count: DEMO_TOTAL_COUNT })}
          </span>
        </div>
      </div>

      <div className="flex flex-none items-center gap-2">
        <div className="border-border bg-muted flex items-center gap-0.5 rounded-lg border p-0.75 max-sm:hidden">
          <span className="bg-card text-foreground flex h-6.5 items-center rounded-md px-2.25 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            FR
          </span>
          <span className="text-muted-foreground flex h-6.5 items-center rounded-md px-2.25 text-xs font-medium">
            EN
          </span>
        </div>
        <span className="border-border text-secondary-foreground flex size-8.5 flex-none items-center justify-center rounded-lg border max-sm:hidden">
          <Moon className="size-4" />
        </span>
        <span className="bg-primary text-primary-foreground flex h-8.5 flex-none items-center gap-1.75 rounded-lg px-3.5 text-sm font-semibold">
          <Plus className="size-4" />
          <span className="max-sm:hidden">{m.header_newOpportunity()}</span>
        </span>
      </div>
    </div>
  )
}

// Yields below xl so the real table keeps its full column set.
function Sidebar() {
  return (
    <aside className="border-border-soft flex w-57 flex-none flex-col border-r p-3 max-xl:hidden">
      <div className="flex items-center gap-2.5 px-1.5 py-1">
        <span className="bg-primary text-primary-foreground flex size-8.5 flex-none items-center justify-center rounded-lg">
          <BrandMark className="size-8" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground font-heading tracking-title text-sm font-semibold">
            {CONFIG.brand}
          </span>
          <span className="text-muted-foreground truncate text-xs">{m.common_tagline()}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-0.5">
        <span className="bg-accent text-accent-foreground flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium">
          <LayoutList className="size-4" />
          {m.nav_tracker()}
        </span>
        <span className="text-secondary-foreground flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium">
          <SlidersHorizontal className="size-4" />
          {m.nav_customize()}
        </span>
      </div>

      <p className="text-muted-foreground tracking-label text-2xs mt-5 px-2.5 font-semibold uppercase">
        {m.landing_demoPipeline()}
      </p>
      <div className="mt-2 flex flex-col gap-0.5">
        {DEMO_PIPELINE.map((stage) => (
          <span
            key={stage.name}
            className="text-secondary-foreground flex h-7.5 items-center gap-2.5 rounded-lg px-2.5 text-sm"
            style={{ '--stage-dot': stageColorVar(stage.color) } as React.CSSProperties}
          >
            <StageDot size="md" />
            <span className="min-w-0 flex-1 truncate">{stage.name}</span>
            <span className="text-muted-foreground flex-none text-xs tabular-nums">
              {stage.count}
            </span>
          </span>
        ))}
      </div>

      <p className="text-muted-foreground tracking-label text-2xs mt-5 px-2.5 font-semibold uppercase">
        {m.landing_demoReminders()}
      </p>
      <div className="border-border-soft mt-2 rounded-xl border p-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-destructive/10 text-destructive flex size-8 flex-none items-center justify-center rounded-full">
            <Bell className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground text-sm font-semibold tabular-nums">
              {DEMO_FOLLOW_UP_TOTAL} {m.landing_demoSideRemaining()}
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              0/{DEMO_FOLLOW_UP_TOTAL} {m.landing_demoSideProgress()}
            </span>
          </div>
        </div>
        <span className="bg-primary text-primary-foreground mt-3 flex h-8.5 items-center justify-center rounded-lg px-3 text-sm font-semibold">
          {m.landing_demoRunReminders()}
        </span>
      </div>

      <div className="border-border-soft mt-auto flex items-center gap-2.5 border-t px-1.5 pt-3">
        <span className="bg-muted text-secondary-foreground flex size-8 flex-none items-center justify-center rounded-full text-xs font-semibold">
          JD
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-semibold">John. D</span>
          <span className="text-muted-foreground truncate text-xs">
            {m.landing_demoProfileRole()}
          </span>
        </div>
        <ChevronDown className="text-muted-foreground size-3.75 flex-none" />
      </div>
    </aside>
  )
}
