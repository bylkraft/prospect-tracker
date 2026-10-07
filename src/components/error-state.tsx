import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

type Props = Partial<{
  title: string
  description: string
  showHomeLink: boolean
  variant: 'page' | 'section' | 'slot'
  onRetry: () => void
}>

export function ErrorState({
  title = m.error_title(),
  description = m.error_description(),
  variant = 'page',
  showHomeLink = variant === 'page',
  onRetry
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-8 text-center',
        variant === 'page' ? 'min-h-screen' : 'size-full min-h-70',
        variant === 'slot' &&
          'border-border bg-card rounded-xl border shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
      )}
    >
      <p
        className={cn(
          'text-muted-foreground/40 font-mono font-bold',
          variant === 'page' ? 'text-6xl' : 'text-4xl'
        )}
      >
        !
      </p>
      <h2
        className={cn(
          'font-heading font-semibold tracking-tight',
          variant === 'page' ? 'text-2xl' : 'text-lg'
        )}
      >
        {title}
      </h2>

      <p className="text-muted-foreground max-w-sm">{description}</p>

      <div className="mt-2 flex gap-3">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            {m.common_retry()}
          </Button>
        ) : null}
        {showHomeLink ? (
          <Button variant="outline" nativeButton={false} render={<Link to={APP_ROUTES.home} />}>
            {m.common_backHome()}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
