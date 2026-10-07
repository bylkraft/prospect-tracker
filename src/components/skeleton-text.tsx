import { cn } from '@/lib/utils'

export function SkeletonText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="skeleton"
      aria-hidden
      className={cn(
        'bg-muted animate-pulse rounded-sm box-decoration-clone text-transparent select-none',
        className
      )}
      {...props}
    />
  )
}
