import { Link } from '@tanstack/react-router'
import {
  Archive,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Mail,
  Pencil,
  Pin,
  Plus,
  Search,
  Sparkles,
  UserRound,
  X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { BrandMark } from '@/components/icons/brand-mark'
import { Button } from '@/components/ui/button'
import { NumberTicker } from '@/components/number-ticker'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'
import {
  Eyebrow,
  Section,
  SectionLead,
  SectionSubtitle,
  SectionTitle
} from '@/modules/landing/components/section'
import { Reveal } from '@/modules/landing/components/reveal'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { OPPORTUNITIES_SEARCH_DEFAULTS } from '@/modules/opportunities/opportunities-schema'
import { APP_ROUTES } from '@/lib/routes'
import {
  DEMO_JOB_TYPES,
  DEMO_KPIS,
  DEMO_PIPELINE,
  DEMO_SENIORITY,
  DEMO_SOURCES,
  DEMO_STAGE_PALETTE,
  DEMO_ROWS,
  DEMO_STAGES,
  DEMO_STAGE_COUNTS,
  DEMO_STEP_FOLLOW_UPS,
  DEMO_TJM_REFERENCE,
  DEMO_TOTAL_COUNT
} from '@/modules/landing/landing-data'

export function LandingKpis() {
  const cards = [
    {
      label: m.kpi_dueToday(),
      value: DEMO_KPIS.dueToday,
      desc: m.landing_kpiDueTodayDesc(),
      accent: true
    },
    { label: m.kpi_stale(), value: DEMO_KPIS.stale, desc: m.landing_kpiStaleDesc() },
    { label: m.kpi_interviews(), value: DEMO_KPIS.interviews, desc: m.landing_kpiInterviewsDesc() },
    {
      label: m.kpi_responseRate(),
      value: DEMO_KPIS.responseRate,
      suffix: ' %',
      desc: m.landing_kpiResponseRateDesc()
    }
  ]

  return (
    <Section inverted glow="left">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="max-w-165">
            <Eyebrow>{m.landing_kpiEyebrow()}</Eyebrow>
            <SectionTitle>{m.landing_kpiTitle()}</SectionTitle>
          </div>
          <SectionLead className="mt-0 max-w-85">{m.landing_kpiSubtitle()}</SectionLead>
        </div>
      </Reveal>

      <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Reveal
            key={card.label}
            delay={index * 0.07}
            className={cn(
              'h-full rounded-[18px] border p-5 transition-transform duration-200 hover:-translate-y-0.75',
              card.accent
                ? 'border-[color-mix(in_oklch,var(--destructive)_30%,transparent)] bg-[color-mix(in_oklch,var(--destructive)_12%,var(--card))]'
                : 'border-border bg-card'
            )}
          >
            <p className="text-secondary-foreground text-sm font-medium">{card.label}</p>
            <NumberTicker
              value={card.value}
              suffix={card.suffix}
              className={cn(
                'tracking-page-title mt-4 block text-[2.75rem] leading-none font-semibold tabular-nums',
                card.accent ? 'text-destructive' : 'text-foreground'
              )}
            />
            <p className="text-secondary-foreground mt-3.5 text-sm leading-5 text-pretty">
              {card.desc}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

export function LandingColumns() {
  const columns = DEMO_STAGES.map((stage) => ({
    ...stage,
    count: DEMO_STAGE_COUNTS[stage.name] ?? 0,
    cards: DEMO_ROWS.filter((row) => row.stage === stage.name)
  }))

  return (
    <section
      id="fonctionnalites"
      className="border-border-soft bg-card overflow-hidden border-b pt-16 md:pt-24"
    >
      <Reveal className="mx-auto max-w-[1160px] px-5 text-center md:px-6">
        <div className="inline-flex items-center gap-2.5">
          <Eyebrow>{m.landing_columnsEyebrow()}</Eyebrow>
          <span className="border-border bg-muted text-muted-foreground flex h-5 items-center rounded-full border px-2 text-xs font-medium">
            {m.landing_soon()}
          </span>
        </div>
        <h3 className="font-heading tracking-page-title mx-auto mt-3.5 max-w-205 text-[clamp(1.5rem,2.8vw,2.25rem)] leading-[1.1] font-semibold text-balance">
          {m.landing_columnsTitle()}
        </h3>
        <SectionLead className="mx-auto max-w-160">
          {m.landing_columnsBody()} {m.landing_columnsDragSoon()}
        </SectionLead>

        <p className="text-muted-foreground mt-8 mb-3 text-xs leading-4.25">
          {m.landing_columnsSourcesTitle()}
        </p>

        <SourcesMarquee />
      </Reveal>

      <Reveal delay={0.08} className="mt-14 flex justify-center overflow-hidden">
        {/* Fixed-width frame, clipped by the section — the board bleeds off the bottom edge. */}
        <div className="border-border bg-background w-355 flex-none overflow-hidden rounded-t-[18px] border shadow-[0_24px_60px_-30px_color-mix(in_oklch,var(--foreground)_32%,transparent)] max-md:w-full">
          <div className="border-border-soft bg-card flex items-center justify-between gap-3.5 border-b px-4.5 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-foreground font-heading tracking-title text-md font-semibold">
                {m.nav_tracker()}
              </span>
              <span className="bg-muted text-muted-foreground flex h-5 flex-none items-center rounded-full px-2 text-xs font-medium tabular-nums">
                {DEMO_TOTAL_COUNT} {m.landing_demoActiveShort()}
              </span>
            </div>
            <span className="text-muted-foreground flex-none text-xs">
              {m.landing_demoStageView()}
            </span>
          </div>

          <div className="grid max-h-110 grid-cols-5 items-start gap-3.5 overflow-hidden p-4.5 max-md:grid-cols-2">
            {columns.map((column) => (
              <div
                key={column.name}
                className="border-border-soft flex flex-col gap-2.5 rounded-[12.5px] border bg-[color-mix(in_oklch,var(--muted)_70%,var(--card))] p-3"
              >
                <div
                  className="flex items-center gap-2"
                  style={{ '--stage-dot': stageColorVar(column.color) } as React.CSSProperties}
                >
                  <StageDot size="md" />
                  <span className="text-foreground min-w-0 flex-1 truncate text-left text-sm font-semibold">
                    {column.name}
                  </span>
                  <span className="text-muted-foreground flex-none text-xs tabular-nums">
                    {column.count}
                  </span>
                </div>

                {column.cards.map((card) => (
                  <div
                    key={card.recruiter}
                    className="border-border bg-card flex flex-col gap-2 rounded-[12.5px] border p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-180 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-14px_color-mix(in_oklch,var(--foreground)_26%,transparent)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-foreground truncate text-sm font-semibold">
                        {card.recruiter}
                      </span>
                      <span
                        className={cn(
                          'flex-none text-sm font-semibold tabular-nums',
                          card.aboveReference ? 'text-rate-above' : 'text-rate-below'
                        )}
                      >
                        {card.dailyRate} €
                      </span>
                    </div>
                    <span className="text-muted-foreground truncate text-xs">
                      {card.esn ?? 'Direct'} · {card.client}
                    </span>
                    <span
                      className={cn(
                        'text-[12px] tabular-nums',
                        card.late ? 'text-rate-below font-semibold' : 'text-muted-foreground'
                      )}
                    >
                      {card.date}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

// Two identical tracks scrolling to -50% make the loop seamless.
function SourcesMarquee() {
  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        data-marquee-track
        className="flex w-max [animation:landing-marquee_34s_linear_infinite] gap-2.5 group-hover:[animation-play-state:paused]"
      >
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex gap-2.5">
            {DEMO_SOURCES.map((source) => (
              <span
                key={source}
                className="border-border bg-background text-secondary-foreground flex h-7 flex-none items-center rounded-full border px-3 text-xs font-medium whitespace-nowrap"
              >
                {source}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandingCustomize() {
  const points = [
    m.landing_customizePoint1(),
    m.landing_customizePoint2(),
    m.landing_customizePoint3(),
    m.landing_customizePoint4()
  ]

  return (
    <Section>
      <div className="grid items-center gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <Reveal delay={0.08}>
          <div className="border-border bg-card overflow-hidden rounded-[20px] border shadow-[0_10px_26px_-14px_color-mix(in_oklch,var(--foreground)_26%,transparent)]">
            <div className="border-border-soft flex items-center justify-between gap-3 border-b px-4 py-3.5">
              <span className="text-foreground font-heading tracking-title text-md font-semibold">
                {m.nav_customize()}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {m.landing_customizeStagesCount()}
              </span>
            </div>

            <div className="bg-background flex flex-col gap-3.5 p-4">
              <div className="border-border bg-card flex flex-wrap items-center gap-3.5 rounded-[12.5px] border px-3.5 py-3">
                <span className="text-muted-foreground tracking-label text-2xs font-semibold uppercase">
                  {m.landing_tjmReference()}
                </span>
                <span className="border-border bg-muted text-foreground flex h-8.5 items-center gap-1.5 rounded-[9px] border px-3 text-sm font-semibold tabular-nums">
                  {DEMO_TJM_REFERENCE}
                  <span className="text-muted-foreground font-medium">€</span>
                </span>
                <span className="text-rate-above text-xs font-semibold">≥ vert</span>
                <span className="text-rate-below text-xs font-semibold">&lt; rouge</span>
              </div>

              <div className="flex flex-col gap-2">
                {DEMO_STAGES.map((stage) => (
                  <div
                    key={stage.name}
                    className="border-border bg-card flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5"
                  >
                    {/* Reorder arrows, not a drag grip — stages move a step at a time. */}
                    <span className="flex flex-none flex-col gap-px text-[color-mix(in_oklch,var(--muted-foreground)_60%,transparent)]">
                      <ChevronUp className="size-2.5" strokeWidth={2.6} />
                      <ChevronDown className="size-2.5" strokeWidth={2.6} />
                    </span>
                    <span
                      className="size-2.75 flex-none rounded-full bg-(--stage-dot)"
                      style={{ '--stage-dot': stageColorVar(stage.color) } as React.CSSProperties}
                    />
                    <span className="text-foreground min-w-0 flex-1 truncate text-[12.5px] font-medium">
                      {stage.name}
                    </span>
                    <span className="border-border bg-muted text-foreground flex h-6.5 flex-none items-center gap-1.25 rounded-lg border px-2.25 text-[11.5px] font-semibold tabular-nums">
                      {stage.delayDays}
                      <span className="text-muted-foreground font-medium">j</span>
                    </span>
                    <span className="text-muted-foreground w-13 flex-none text-right text-[11.5px] tabular-nums">
                      {DEMO_STAGE_COUNTS[stage.name]} {m.landing_opportunitiesShort()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 px-1">
                <span className="text-muted-foreground tracking-label text-2xs font-semibold uppercase">
                  {m.landing_customizeColors()}
                </span>
                <div className="flex gap-1.25">
                  {DEMO_STAGE_PALETTE.map((color) => (
                    <span
                      key={color}
                      className="size-4 rounded-[5px] bg-(--stage-dot)"
                      style={{ '--stage-dot': stageColorVar(color) } as React.CSSProperties}
                    />
                  ))}
                </div>
              </div>

              <div className="border-border bg-card text-secondary-foreground flex h-9.5 items-center justify-center gap-1.75 rounded-[12.5px] border border-dashed text-xs font-semibold">
                <Plus className="size-3.5" />
                {m.landing_customizeAddStage()}
              </div>

              <div className="border-border-soft flex items-center gap-2.25 rounded-[10px] border bg-[color-mix(in_oklch,var(--muted)_60%,var(--card))] px-3 py-2.5">
                <Archive className="text-muted-foreground size-3.5 flex-none" />
                <span className="text-muted-foreground tracking-label text-2xs flex-1 font-semibold uppercase">
                  {m.landing_customizeArchived()}
                </span>
                <span className="text-muted-foreground text-[11.5px]">
                  {m.landing_customizeArchivedList()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <TagColumn label={m.landing_customizeJobTypes()} items={DEMO_JOB_TYPES} />
                <TagColumn label={m.landing_customizeSeniority()} items={DEMO_SENIORITY} />
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <Eyebrow>{m.landing_customizeEyebrow()}</Eyebrow>
          <SectionSubtitle>{m.landing_customizeTitle()}</SectionSubtitle>
          <ul className="mt-6 flex flex-col gap-3.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="bg-primary/10 text-accent-foreground mt-0.25 flex size-5 flex-none items-center justify-center rounded-full">
                  <Check className="size-3" />
                </span>
                <span className="text-secondary-foreground text-md leading-6.5 text-pretty">
                  {point}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-5 text-xs">{m.landing_stagesNote()}</p>
        </Reveal>
      </div>
    </Section>
  )
}

function TagColumn({
  label,
  items
}: {
  label: string
  items: readonly { label: string; count: number }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground tracking-label text-2xs px-0.5 font-semibold uppercase">
        {label}
      </span>
      {items.map((item) => (
        <div
          key={item.label}
          className="border-border bg-card flex items-center gap-2 rounded-[9px] border px-2.25 py-1.75"
        >
          <span className="text-foreground min-w-0 flex-1 truncate text-[11.5px] font-medium">
            {item.label}
          </span>
          <span className="text-muted-foreground flex-none text-[11px] tabular-nums">
            {item.count} {m.landing_opportunitiesShort()}
          </span>
        </div>
      ))}
    </div>
  )
}

export function LandingNotion() {
  const points = [m.landing_notionPoint1(), m.landing_notionPoint2(), m.landing_notionPoint3()]

  return (
    <Section>
      <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-14">
        <Reveal delay={0.08} className="lg:order-2">
          <div className="ring-foreground/10 bg-card overflow-hidden rounded-2xl shadow-[0_24px_60px_-30px_color-mix(in_oklch,var(--foreground)_32%,transparent)] ring-1">
            <div className="border-border-soft flex items-center gap-3 border-b px-4 py-3.5">
              <span className="bg-accent text-accent-foreground flex size-8 flex-none items-center justify-center rounded-lg">
                <Pencil className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-semibold">{m.landing_recordTitle()}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {m.landing_recordSubtitle()}
                </p>
              </div>
              <X className="text-muted-foreground size-4 flex-none" />
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <RecordField label={m.landing_step2Recruiter()} value="Camille Ferrand" required />
                <RecordField label={m.landing_recordPhone()} value="+33 6 12 44 87 903" />
                <RecordField label="ESN" value="Sopra Steria" />
                <RecordField label={m.landing_recordEndClient()} value="Société Générale" />
              </div>

              <Divider>{m.landing_recordMission()}</Divider>

              <div className="grid grid-cols-2 gap-2.5">
                <RecordField label={m.landing_recordRole()} value="FullStack" caret />
                <RecordField label="TJM" value="620 € / j" />
              </div>

              <Divider>{m.landing_recordTracking()}</Divider>

              <p className="text-secondary-foreground text-xs font-medium">{m.table_colStage()}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DEMO_PIPELINE.map((stage) => (
                  <span
                    key={stage.name}
                    style={{ '--stage-dot': stageColorVar(stage.color) } as React.CSSProperties}
                    className={cn(
                      'flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs',
                      stage.name === 'Entretien'
                        ? 'border-primary/40 bg-accent text-accent-foreground font-semibold'
                        : 'border-border text-secondary-foreground'
                    )}
                  >
                    <StageDot />
                    {stage.name}
                  </span>
                ))}
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                <RecordField label={m.landing_recordLastContact()} value="18/08/2026" caret />
                <RecordField label={m.landing_recordNextFollowUp()} value="27/08/2026" caret />
              </div>
              <p className="text-muted-foreground mt-2 text-xs">{m.landing_recordNextHint()}</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="lg:order-1">
          <Eyebrow>{m.landing_notionEyebrow()}</Eyebrow>
          <SectionSubtitle>{m.landing_notionTitle()}</SectionSubtitle>
          <SectionLead>{m.landing_notionBody1()}</SectionLead>

          <ul className="mt-6 flex flex-col gap-3.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="bg-primary/10 text-accent-foreground mt-0.25 flex size-5 flex-none items-center justify-center rounded-full">
                  <Check className="size-3" />
                </span>
                <span className="text-secondary-foreground text-md leading-6.5 text-pretty">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  )
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="bg-border-soft h-px flex-1" />
      <span className="text-muted-foreground tracking-label text-2xs font-semibold uppercase">
        {children}
      </span>
      <span className="bg-border-soft h-px flex-1" />
    </div>
  )
}

function RecordField({
  label,
  value,
  required,
  caret
}: {
  label: string
  value: string
  required?: boolean
  caret?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-secondary-foreground text-xs font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      <span className="border-input bg-secondary text-foreground flex h-8.5 items-center gap-1.5 rounded-lg border px-2.5">
        <span className="min-w-0 flex-1 truncate text-xs">{value}</span>
        {caret ? <ChevronDown className="text-muted-foreground size-3 flex-none" /> : null}
      </span>
    </div>
  )
}

export function LandingTrio() {
  const cards = [
    { icon: Pin, title: m.landing_trioPinTitle(), body: m.landing_trioPinBody() },
    { icon: Search, title: m.landing_trioSearchTitle(), body: m.landing_trioSearchBody() },
    { icon: Mail, title: m.landing_trioAccountTitle(), body: m.landing_trioAccountBody() }
  ]

  return (
    <section className="border-border-soft bg-card border-y py-16 md:py-20">
      <div className="mx-auto grid max-w-[1160px] gap-4 px-5 md:grid-cols-3 md:px-6">
        {cards.map((card, index) => (
          <Reveal
            key={card.title}
            delay={index * 0.07}
            className="border-border bg-background h-full rounded-[18px] border p-5.5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.75 hover:shadow-[0_10px_26px_-14px_color-mix(in_oklch,var(--foreground)_26%,transparent)]"
          >
            <span className="bg-accent text-accent-foreground flex size-8.5 items-center justify-center rounded-[9px]">
              <card.icon className="size-4.5" strokeWidth={1.9} />
            </span>
            <p className="text-foreground font-heading tracking-title text-md mt-4 font-semibold">
              {card.title}
            </p>
            <p className="text-secondary-foreground mt-2 text-sm leading-5 text-pretty">
              {card.body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function LandingPricing() {
  const free = [
    m.landing_pricingFeature1(),
    m.landing_pricingFeature2(),
    m.landing_pricingFeature3(),
    m.landing_pricingFeature4(),
    m.landing_pricingFeature5()
  ]
  const pro = [
    m.landing_pricingPro1(),
    m.landing_pricingPro2(),
    m.landing_pricingPro3(),
    m.landing_pricingPro4(),
    m.landing_pricingPro5()
  ]

  return (
    <Section>
      <Reveal>
        <Eyebrow>{m.landing_pricingEyebrow()}</Eyebrow>
        <SectionTitle>{m.landing_pricingTitle()}</SectionTitle>
        <SectionLead>{m.landing_pricingSubtitle()}</SectionLead>
      </Reveal>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal className="border-border bg-card rounded-[20px] border p-6.5 shadow-[0_10px_26px_-14px_color-mix(in_oklch,var(--foreground)_26%,transparent),0_1px_3px_-1px_color-mix(in_oklch,var(--foreground)_10%,transparent)]">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-foreground font-heading tracking-title text-xl font-semibold">
              {m.landing_pricingFree()}
            </span>
            <span className="text-muted-foreground text-xs">{m.landing_pricingFreeNote()}</span>
          </div>

          <ul className="mt-5.5 flex flex-col gap-3">
            {free.map((feature) => (
              <li
                key={feature}
                className="text-secondary-foreground flex items-start gap-2.5 text-sm leading-5"
              >
                <Check className="text-rate-above mt-0.5 size-3.75 flex-none" strokeWidth={2.2} />
                <span className="text-pretty">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            render={<Link to={APP_ROUTES.tracker} search={OPPORTUNITIES_SEARCH_DEFAULTS} />}
            size="lg"
            className="mt-6.5 font-semibold max-sm:w-full"
          >
            {m.landing_ctaPrimary()}
            <ArrowRight />
          </Button>
        </Reveal>

        <Reveal
          delay={0.08}
          className="border-border bg-card rounded-[20px] border border-dashed p-6.5"
        >
          <p className="text-muted-foreground tracking-label text-2xs font-semibold uppercase">
            {m.landing_pricingProEyebrow()}
          </p>

          <p className="text-secondary-foreground mt-3 text-sm leading-5.5 text-pretty">
            {m.landing_pricingProNote()}
          </p>

          <ul className="mt-5 flex flex-col gap-3">
            {pro.map((feature) => (
              <li
                key={feature}
                className="text-secondary-foreground flex items-start gap-2.5 text-sm leading-5"
              >
                <Sparkles className="text-muted-foreground mt-0.5 size-3.75 flex-none" />
                <span className="text-pretty">{feature}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  )
}

export function LandingFaq() {
  const items = [
    { q: m.landing_faqQ1(), a: m.landing_faqA1() },
    { q: m.landing_faqQ2(), a: m.landing_faqA2() },
    { q: m.landing_faqQ3(), a: m.landing_faqA3() },
    { q: m.landing_faqQ4(), a: m.landing_faqA4() },
    { q: m.landing_faqQ5(), a: m.landing_faqA5() }
  ]

  return (
    <section className="border-border-soft bg-card border-t py-16 md:py-24">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <Reveal className="mx-auto max-w-180">
          <Eyebrow>{m.landing_faqEyebrow()}</Eyebrow>
          <SectionTitle>{m.landing_faqTitle()}</SectionTitle>

          <div className="border-border mt-9 border-t">
            <Accordion defaultValue={[items[0]?.q ?? '']}>
              {items.map((item) => (
                <AccordionItem key={item.q} value={item.q} className="border-border border-b">
                  <AccordionTrigger className="font-heading tracking-title text-md py-5 text-left font-semibold">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-secondary-foreground max-w-155 pb-5.5 text-[15px] leading-6 text-pretty">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function LandingSteps() {
  return (
    <Section>
      <Reveal className="max-w-170">
        <Eyebrow>{m.landing_stepsEyebrow()}</Eyebrow>
        <SectionTitle>{m.landing_stepsTitle()}</SectionTitle>
      </Reveal>

      <div className="mt-9 grid items-stretch gap-5 md:grid-cols-3">
        <Step
          index={1}
          icon={UserRound}
          title={m.landing_step1Title()}
          body={m.landing_step1Body()}
        >
          <div className="border-border bg-card flex w-full max-w-59.5 flex-col items-center gap-2.5 rounded-[14px] border p-4">
            <span className="bg-primary text-primary-foreground flex size-7.5 flex-none items-center justify-center rounded-[9px]">
              <BrandMark className="size-7" />
            </span>
            <span className="border-border bg-muted text-muted-foreground flex h-8 w-full items-center rounded-lg border px-2.5 text-xs">
              {m.landing_step1Field()}
            </span>
            <span className="bg-primary text-primary-foreground flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold">
              {m.landing_step1Cta()}
            </span>
            <span className="border-border bg-card text-secondary-foreground flex h-8 w-full items-center justify-center gap-1.75 rounded-lg border text-xs font-medium">
              {m.landing_step1Google()}
            </span>
          </div>
        </Step>

        <Step index={2} icon={Plus} title={m.landing_step2Title()} body={m.landing_step2Body()}>
          <div className="border-border bg-background grid w-full max-w-65.5 grid-cols-2 gap-2.5 rounded-[14px] border p-3.5">
            <Field label={m.landing_step2Recruiter()} value="Camille Ferrand" />
            <Field label={m.landing_step2Esn()} value="Sopra Steria" />
            <Field label={m.landing_step2Rate()} value="620 € / j" />
            <Field label={m.landing_step2Stage()} value="Entretien" />
            <span className="bg-primary text-primary-foreground col-span-2 flex h-7.5 items-center justify-center rounded-lg text-xs font-semibold">
              {m.landing_step2Save()}
            </span>
          </div>
        </Step>

        <Step
          index={3}
          icon={Mail}
          title={m.landing_step3Title()}
          body={m.landing_step3Body()}
          inverted
        >
          <div className="border-border bg-card flex w-full max-w-65.5 flex-col gap-2.5 rounded-[14px] border p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground text-xs font-semibold">
                {m.landing_step3Count()}
              </span>
              <span className="text-muted-foreground text-[10px] tabular-nums">
                {m.landing_step3Time()}
              </span>
            </div>
            {DEMO_STEP_FOLLOW_UPS.map((item) => (
              <span
                key={item.recruiter}
                style={{ '--stage-dot': stageColorVar(item.stageColor) } as React.CSSProperties}
                className="border-border-soft bg-muted flex items-center gap-2 rounded-[9px] border px-2.5 py-2"
              >
                <StageDot />
                <span className="text-foreground min-w-0 flex-1 truncate text-[10.5px] font-semibold">
                  {item.recruiter}
                </span>
                <span className="text-destructive flex-none text-[10.5px] font-semibold tabular-nums">
                  +{item.overdueDays} j
                </span>
              </span>
            ))}
            <span className="bg-primary text-primary-foreground flex h-7.5 items-center justify-center rounded-lg text-xs font-semibold">
              {m.landing_mailOpenList()}
            </span>
          </div>
        </Step>
      </div>
    </Section>
  )
}

type StepProps = {
  index: number
  title: string
  body: string
  icon: LucideIcon
  /** The last step is a dark card — it stands for the morning email. */
  inverted?: boolean
  children: React.ReactNode
}

function Step({ index, title, body, icon: Icon, inverted, children }: StepProps) {
  return (
    <Reveal
      delay={(index - 1) * 0.08}
      className={cn(
        'border-border flex h-full flex-col overflow-hidden rounded-[20px] border',
        inverted
          ? 'dark bg-band shadow-[0_24px_60px_-30px_color-mix(in_oklch,var(--foreground)_32%,transparent)]'
          : 'bg-card shadow-[0_10px_26px_-14px_color-mix(in_oklch,var(--foreground)_26%,transparent),0_1px_3px_-1px_color-mix(in_oklch,var(--foreground)_10%,transparent)]'
      )}
    >
      <div
        className={cn(
          'border-border-soft flex items-center gap-2.5 border-b px-4 py-3',
          inverted ? 'bg-card' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'border-border flex size-5.5 flex-none items-center justify-center rounded-[7px] border text-xs font-semibold tabular-nums',
            inverted
              ? 'text-foreground bg-[color-mix(in_oklch,var(--primary)_30%,transparent)]'
              : 'bg-card text-secondary-foreground'
          )}
        >
          {index}
        </span>
        <span className="text-muted-foreground tracking-label text-2xs font-semibold uppercase">
          {m.landing_stepLabel()} {index}
        </span>
      </div>

      <div
        className={cn(
          'flex min-h-50 items-center justify-center p-4.5',
          inverted ? 'bg-background' : 'bg-muted'
        )}
      >
        {children}
      </div>

      <div className="border-border-soft flex flex-col gap-1.5 border-t p-4.5">
        <span
          className={cn(
            'text-accent-foreground flex size-8 items-center justify-center rounded-[9px]',
            inverted ? 'bg-[color-mix(in_oklch,var(--primary)_26%,transparent)]' : 'bg-accent'
          )}
        >
          <Icon className="size-4.25" />
        </span>
        <p className="text-foreground font-heading tracking-title text-md mt-2 font-semibold text-pretty">
          {title}
        </p>
        <p className="text-secondary-foreground text-sm leading-5 text-pretty">{body}</p>
      </div>
    </Reveal>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.25">
      <span className="text-secondary-foreground text-[10px] font-medium">{label}</span>
      <span className="border-border bg-card text-foreground flex h-7.5 items-center rounded-lg border px-2.5">
        <span className="truncate text-[11px]">{value}</span>
      </span>
    </div>
  )
}

export function LandingFinalCta() {
  return (
    <Section inverted glow="center" className="text-center">
      <Reveal className="mx-auto max-w-165">
        <h2 className="font-heading tracking-page-title text-[clamp(1.75rem,3.2vw,2.625rem)] leading-[1.08] font-semibold text-balance">
          {m.landing_finalTitle()}
        </h2>
        <p className="text-secondary-foreground text-md mt-4.5 leading-6.5 text-pretty">
          {m.landing_finalBody()}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            render={<Link to={APP_ROUTES.tracker} search={OPPORTUNITIES_SEARCH_DEFAULTS} />}
            size="lg"
            className="group font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)] max-sm:w-full"
          >
            {m.landing_ctaPrimary()}
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
          <p className="text-muted-foreground text-xs">{m.landing_ctaReassurance()}</p>
        </div>
      </Reveal>
    </Section>
  )
}
