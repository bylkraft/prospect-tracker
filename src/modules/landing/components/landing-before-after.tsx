import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Briefcase, Check, Mail, Smartphone, Sparkles, Table2, X } from 'lucide-react'
import { useState } from 'react'

import { BrandMark } from '@/components/icons/brand-mark'
import { StageBadge } from '@/modules/stages/components/stage-badge'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'
import { Reveal } from '@/modules/landing/components/reveal'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { CONFIG } from '@/lib/config'
import {
  DEMO_FOLLOW_UP_TOTAL,
  DEMO_KPIS,
  DEMO_PIPELINE,
  DEMO_ROWS
} from '@/modules/landing/landing-data'

// The scattered tools are inset by uneven amounts — that raggedness is the point.
const SCATTERED = [
  {
    icon: Table2,
    indent: 0,
    title: () => m.landing_beforeSheetTitle(),
    body: () => m.landing_beforeSheetBody()
  },
  {
    icon: Mail,
    indent: 24,
    title: () => m.landing_beforeMailTitle(),
    body: () => m.landing_beforeMailBody()
  },
  {
    icon: Briefcase,
    indent: 44,
    title: () => m.landing_beforePlatformsTitle(),
    body: () => m.landing_beforePlatformsBody()
  },
  {
    icon: Smartphone,
    indent: 20,
    title: () => m.landing_beforeReminderTitle(),
    body: () => m.landing_beforeReminderBody()
  }
]

export function LandingBeforeAfter() {
  const [showAfter, setShowAfter] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const bullets = showAfter
    ? [
        m.landing_afterGain1(),
        m.landing_afterGain2(),
        m.landing_afterGain3(),
        m.landing_afterGain4()
      ]
    : [
        m.landing_beforePain1(),
        m.landing_beforePain2(),
        m.landing_beforePain3(),
        m.landing_beforePain4()
      ]

  return (
    <section className="border-border-soft bg-card border-y py-16 md:py-24">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <Reveal>
          <div className="max-w-190">
            <p className="text-accent-foreground tracking-label text-2xs font-semibold uppercase">
              {m.landing_beforeEyebrow()}
            </p>
            <h2 className="font-heading tracking-page-title mt-3.5 text-[clamp(1.625rem,3vw,2.375rem)] leading-[1.1] font-semibold text-balance">
              {m.landing_beforeTitle()}
            </h2>
          </div>

          <div className="border-border bg-muted mt-6.5 inline-flex items-center gap-0.5 rounded-[9px] border p-0.75 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
            <ToggleButton active={!showAfter} onClick={() => setShowAfter(false)}>
              <Table2 className="size-3.5" />
              {m.landing_beforeToggleWithout()}
            </ToggleButton>
            <ToggleButton active={showAfter} onClick={() => setShowAfter(true)}>
              <Sparkles className="size-3.5" />
              {m.landing_beforeToggleWith()}
            </ToggleButton>
          </div>
        </Reveal>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="flex min-h-109 items-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showAfter ? 'after' : 'before'}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                {showAfter ? <AfterPanel /> : <BeforePanel />}
              </motion.div>
            </AnimatePresence>
          </div>

          <ul className="flex min-h-109 flex-col justify-center gap-4">
            {bullets.map((bullet) => (
              <motion.li
                key={bullet}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3"
              >
                <span
                  className={cn(
                    'mt-0.5 flex size-5.5 flex-none items-center justify-center rounded-full transition-colors',
                    showAfter
                      ? 'text-rate-above bg-[color-mix(in_oklch,var(--st-green)_14%,transparent)]'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {showAfter ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : (
                    <X className="size-3" strokeWidth={3} />
                  )}
                </span>
                <p className="text-secondary-foreground text-md leading-6.25 text-pretty">
                  {bullet}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function ToggleButton({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-8.5 cursor-pointer items-center gap-1.75 rounded-md px-3 text-sm transition-colors',
        active
          ? 'bg-card text-foreground font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
          : 'text-muted-foreground hover:text-foreground font-medium'
      )}
    >
      {children}
    </button>
  )
}

function BeforePanel() {
  return (
    <div className="border-border bg-background flex w-full flex-col gap-2.5 rounded-[20px] border p-6">
      {SCATTERED.map((item) => (
        <div
          key={item.title()}
          style={{ marginInlineStart: item.indent }}
          className="border-border bg-card flex items-start gap-3 rounded-[14px] border p-3.5 shadow-[0_10px_26px_-14px_color-mix(in_oklch,var(--foreground)_26%,transparent),0_1px_3px_-1px_color-mix(in_oklch,var(--foreground)_10%,transparent)]"
        >
          <span className="bg-muted text-secondary-foreground flex size-8 flex-none items-center justify-center rounded-[9px]">
            <item.icon className="size-4.25" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-foreground text-sm font-semibold">{item.title()}</p>
            <p className="text-muted-foreground mt-1 text-[12.5px] leading-[18px] text-pretty">
              {item.body()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// A miniature of the real app — same chrome as the hero shot, scaled down.
function AfterPanel() {
  return (
    <div className="border-border bg-background flex min-h-109 w-full overflow-hidden rounded-[20px] border shadow-[0_10px_26px_-14px_color-mix(in_oklch,var(--foreground)_26%,transparent)]">
      <div className="border-border-soft bg-card flex w-33 flex-none flex-col gap-3.5 border-r px-3 py-3.5 max-sm:hidden">
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground flex size-5.5 flex-none items-center justify-center rounded-md">
            <BrandMark className="size-5" />
          </span>
          <span className="text-foreground font-heading tracking-title text-[11.5px] font-semibold">
            {CONFIG.brand}
          </span>
        </div>

        <div className="flex flex-col gap-0.75">
          <span className="bg-accent text-accent-foreground flex h-6.5 items-center rounded-[7px] px-2 text-[11px] font-medium">
            {m.nav_tracker()}
          </span>
          <span className="text-secondary-foreground flex h-6.5 items-center rounded-[7px] px-2 text-[11px] font-medium">
            {m.nav_customize()}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground tracking-label text-[9.5px] font-semibold uppercase">
            {m.landing_demoPipeline()}
          </span>
          {DEMO_PIPELINE.map((stage) => (
            <div
              key={stage.name}
              className="flex items-center gap-1.75"
              style={{ '--stage-dot': stageColorVar(stage.color) } as React.CSSProperties}
            >
              <StageDot />
              <span className="text-secondary-foreground min-w-0 flex-1 truncate text-[10.5px]">
                {stage.name}
              </span>
              <span className="text-muted-foreground flex-none text-[10.5px] tabular-nums">
                {stage.count}
              </span>
            </div>
          ))}
        </div>

        <div className="border-border mt-auto rounded-xl border p-2.5">
          <p className="text-foreground text-[11px] font-semibold tabular-nums">
            {DEMO_FOLLOW_UP_TOTAL} {m.landing_demoSideRemaining()}
          </p>
          <p className="text-muted-foreground mt-0.75 text-[10px] tabular-nums">
            0/{DEMO_FOLLOW_UP_TOTAL} {m.landing_demoSideProgress()}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3.5">
        <div className="grid grid-cols-4 gap-2">
          <MiniKpi label={m.kpi_dueToday()} value={DEMO_KPIS.dueToday} accent />
          <MiniKpi label={m.kpi_stale()} value={DEMO_KPIS.stale} />
          <MiniKpi label={m.kpi_interviews()} value={DEMO_KPIS.interviews} />
          <MiniKpi label={m.kpi_responseRate()} value={`${DEMO_KPIS.responseRate} %`} />
        </div>

        <div className="border-border bg-card overflow-hidden rounded-[10px] border">
          <div className="tracking-label text-muted-foreground grid grid-cols-[56px_1fr_52px_82px] gap-1.5 bg-[color-mix(in_oklch,var(--muted)_60%,var(--card))] px-2.5 py-1.75 text-[9.5px] font-semibold uppercase">
            <span>{m.landing_beforeColContact()}</span>
            <span>{m.landing_beforeColRecruiter()}</span>
            <span className="text-right">{m.landing_beforeColRate()}</span>
            <span className="text-right">{m.landing_beforeColStage()}</span>
          </div>
          {DEMO_ROWS.slice(0, 6).map((row) => (
            <div
              key={row.recruiter}
              className="border-border-soft grid grid-cols-[56px_1fr_52px_82px] items-center gap-1.5 border-t px-2.5 py-1.75"
            >
              <span
                className={cn(
                  'text-[10.5px] tabular-nums',
                  row.late ? 'text-destructive' : 'text-secondary-foreground'
                )}
              >
                {row.date.slice(0, 5)}
              </span>
              <span className="text-foreground truncate text-[11px] font-semibold">
                {row.recruiter}
              </span>
              <span
                className={cn(
                  'text-right text-[10.5px] font-semibold whitespace-nowrap tabular-nums',
                  row.aboveReference ? 'text-rate-above' : 'text-rate-below'
                )}
              >
                {row.dailyRate} €
              </span>
              <span className="flex justify-end">
                <StageBadge name={row.stage} color={row.stageColor} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniKpi({
  label,
  value,
  accent
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'bg-card rounded-[9px] border px-2.5 py-2.25',
        accent ? 'border-[color-mix(in_oklch,var(--destructive)_25%,transparent)]' : 'border-border'
      )}
    >
      <p className="text-secondary-foreground truncate text-[10px] leading-3.5 font-medium">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-[18px] leading-5 font-semibold tabular-nums',
          accent ? 'text-destructive' : 'text-foreground'
        )}
      >
        {value}
      </p>
    </div>
  )
}
