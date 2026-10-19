import { cn } from '@/lib/utils'

// Violet halos lifted from the design — each dark band carries its own, see docs/reference/landing-page.md
const GLOWS = {
  left: 'bg-[radial-gradient(680px_420px_at_16%_8%,color-mix(in_oklch,var(--primary)_30%,transparent),transparent_66%),radial-gradient(420px_300px_at_84%_96%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_66%)]',
  right:
    'bg-[radial-gradient(700px_460px_at_78%_12%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_66%),radial-gradient(440px_320px_at_12%_92%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_66%)]',
  center:
    'bg-[radial-gradient(680px_460px_at_22%_16%,color-mix(in_oklch,var(--primary)_32%,transparent),transparent_66%),radial-gradient(420px_300px_at_78%_88%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_66%)]'
} as const

type SectionProps = {
  id?: string
  /** Dark band that breaks the page rhythm — always paints its own background. */
  inverted?: boolean
  /** Violet halo painted behind an inverted band. */
  glow?: keyof typeof GLOWS
  className?: string
  children: React.ReactNode
}

export function Section({ id, inverted, glow, className, children }: SectionProps) {
  // The dark variant is `&:is(.dark *)`, so the band needs an inner element to paint itself.
  // In dark mode the page is already dark, so the band lifts a step instead of matching it.
  // Every section owns its full vertical rhythm (96px top and bottom) — never a margin,
  // so bands stack flush against each other the way the design does.
  if (inverted) {
    return (
      <section id={id} className="dark">
        <div className="bg-band text-foreground relative overflow-hidden py-16 md:py-24">
          {glow ? (
            <div aria-hidden className={cn('pointer-events-none absolute inset-0', GLOWS[glow])} />
          ) : null}
          <div className={cn('relative mx-auto max-w-[1160px] px-5 md:px-6', className)}>
            {children}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id={id} className="py-16 md:py-24">
      <div className={cn('mx-auto max-w-[1160px] px-5 md:px-6', className)}>{children}</div>
    </section>
  )
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-accent-foreground tracking-label text-2xs font-semibold uppercase">
      {children}
    </p>
  )
}

export function SectionTitle({
  className,
  children
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <h2
      className={cn(
        'font-heading tracking-page-title mt-3.5 max-w-165 text-[clamp(1.625rem,3vw,2.375rem)] leading-[1.1] font-semibold text-balance',
        className
      )}
    >
      {children}
    </h2>
  )
}

/** The half-step-smaller heading the two-column sections use. */
export function SectionSubtitle({
  className,
  children
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <h3
      className={cn(
        'font-heading tracking-title mt-3.5 text-[clamp(1.5rem,2.6vw,2.125rem)] leading-[1.12] font-semibold text-balance',
        className
      )}
    >
      {children}
    </h3>
  )
}

export function SectionLead({
  className,
  children
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'text-secondary-foreground text-md mt-4 max-w-155 leading-6.5 text-pretty',
        className
      )}
    >
      {children}
    </p>
  )
}
