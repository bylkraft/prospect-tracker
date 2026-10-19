import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Inbox, RotateCcw, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'
import { Eyebrow, Section, SectionSubtitle } from '@/modules/landing/components/section'
import { Reveal } from '@/modules/landing/components/reveal'
import { m } from '@/i18n/paraglide/messages'
import { DEMO_FOLLOW_UPS } from '@/modules/landing/landing-data'

export function LandingReminders() {
  const [sent, setSent] = useState<string[]>([])
  // Only true once the last row has finished animating out, so the two never overlap.
  const [isCleared, setIsCleared] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const remaining = DEMO_FOLLOW_UPS.filter((item) => !sent.includes(item.recruiter))
  const isRunning = sent.length > 0 && !isCleared

  // Clears the list one row at a time so the emptying reads as an action, not a jump.
  function runFollowUps() {
    timers.current.forEach(clearTimeout)
    timers.current = DEMO_FOLLOW_UPS.map((item, index) =>
      setTimeout(
        () => {
          setSent((current) => [...current, item.recruiter])
          // No exit animation means no onExitComplete, so settle the end state here.
          if (prefersReducedMotion && index === DEMO_FOLLOW_UPS.length - 1) setIsCleared(true)
        },
        prefersReducedMotion ? 0 : index * 260
      )
    )
  }

  function replay() {
    timers.current.forEach(clearTimeout)
    setIsCleared(false)
    setSent([])
  }

  // Each bullet opens on a bold lead, then continues in the body weight.
  const points = [
    { lead: m.landing_remindersPoint1Lead(), rest: m.landing_remindersPoint1() },
    { lead: m.landing_remindersPoint2Lead(), rest: m.landing_remindersPoint2() },
    { lead: m.landing_remindersPoint3Lead(), rest: m.landing_remindersPoint3() }
  ]

  return (
    <Section id="relances" inverted glow="right">
      <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <Reveal>
          <Eyebrow>{m.landing_remindersEyebrow()}</Eyebrow>
          <SectionSubtitle>{m.landing_remindersTitle()}</SectionSubtitle>

          <ul className="mt-6 flex flex-col gap-3.5">
            {points.map((point) => (
              <li key={point.lead} className="flex items-start gap-3">
                <span className="text-accent-foreground mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--primary)_16%,transparent)]">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <p className="text-secondary-foreground text-[15px] leading-[23px] text-pretty">
                  <span className="text-foreground font-semibold">{point.lead}</span>
                  {point.rest}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-start gap-3">
            <Button
              onClick={isCleared ? replay : runFollowUps}
              disabled={isRunning}
              size="lg"
              variant={isCleared ? 'outline' : 'default'}
              className="font-semibold max-sm:w-full"
            >
              {isCleared ? <RotateCcw /> : <Send />}
              {isCleared ? m.landing_remindersReplay() : m.landing_remindersRun()}
            </Button>
            <p className="text-muted-foreground text-xs">{m.landing_remindersRunHint()}</p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-[0_30px_80px_-34px_rgba(0,0,0,0.78)]">
            <div className="border-border-soft text-muted-foreground flex items-center gap-2 border-b px-4 py-2.75 text-xs">
              <Inbox className="size-3.5" />
              {m.landing_mailInbox()}
            </div>

            <div className="p-4 md:p-5">
              <p className="text-foreground font-heading tracking-title text-md font-semibold text-pretty">
                {m.landing_mailSubject()}
              </p>
              <p className="text-muted-foreground mt-1.5 text-xs">{m.landing_mailFrom()}</p>
              <p className="text-muted-foreground text-xs">{m.landing_mailMeta()}</p>

              <p className="text-secondary-foreground mt-4 text-pretty">{m.landing_mailIntro()}</p>

              <div className="mt-4 flex flex-col gap-1.5">
                <AnimatePresence
                  initial={false}
                  mode="popLayout"
                  onExitComplete={() => {
                    if (remaining.length === 0) setIsCleared(true)
                  }}
                >
                  {remaining.map((item) => (
                    <motion.div
                      key={item.recruiter}
                      layout={!prefersReducedMotion}
                      exit={
                        prefersReducedMotion
                          ? undefined
                          : { opacity: 0, x: 26, height: 0, marginBottom: -6 }
                      }
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="border-border-soft bg-background flex items-center gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <span
                        style={
                          { '--stage-dot': stageColorVar(item.stageColor) } as React.CSSProperties
                        }
                        className="flex min-w-0 flex-1 flex-col gap-1"
                      >
                        <span className="text-foreground truncate font-semibold">
                          {item.recruiter}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                          <StageDot />
                          {item.stage} · {item.context}
                        </span>
                      </span>
                      <span className="text-rate-below flex-none text-xs font-semibold tabular-nums">
                        +{item.overdueDays} j
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isCleared && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="border-border-soft flex flex-col items-center gap-2 rounded-lg border border-dashed px-3 py-8 text-center"
                  >
                    <span className="bg-rate-above/15 text-rate-above flex size-9 items-center justify-center rounded-full">
                      <Check className="size-4.5" />
                    </span>
                    <p className="text-foreground font-semibold">{m.landing_remindersDone()}</p>
                    <p className="text-muted-foreground text-xs">{m.landing_remindersDoneHint()}</p>
                  </motion.div>
                )}
              </div>

              {!isCleared && (
                <p className="text-muted-foreground mt-3 text-xs">{m.landing_mailMore()}</p>
              )}

              <span className="bg-primary text-primary-foreground mt-5 flex h-10 items-center justify-center rounded-lg px-4 font-semibold">
                {m.landing_mailOpenList()}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
