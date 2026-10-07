import { cn } from '@/lib/utils'

type Props = React.PropsWithChildren<{
  title: string
  hint: string
  className?: string
  bodyClassName?: string
  // Rendered flush against the card edges, below the padded body — the archived band and the
  // card footer, which carry their own separators.
  bleed?: React.ReactNode
}>

export function CustomizationCard({
  title,
  hint,
  className,
  bodyClassName,
  bleed,
  children
}: Props) {
  return (
    <section
      className={cn(
        'border-border bg-card rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      <header className="flex items-baseline justify-between gap-3 p-4.5 pb-0">
        <h2 className="text-muted-foreground tracking-label text-2xs font-semibold uppercase">
          {title}
        </h2>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </header>
      <div className={cn('flex flex-col gap-2.5 p-4.5 pt-3.5', bodyClassName)}>{children}</div>
      {bleed}
    </section>
  )
}
