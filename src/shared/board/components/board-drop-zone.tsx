import { cn } from '@/lib/utils'

type Props = {
  label: string
  isOver: boolean
}

// An empty column keeps its footprint and says it accepts a drop, rather than collapsing to a
// header — see docs/reference/board-mechanism.md
export function BoardDropZone({ label, isOver }: Props) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex min-h-24 flex-1 items-center justify-center rounded-lg',
        'border border-dashed px-3 text-center text-xs transition-colors duration-300 ease-out',
        isOver ? 'border-primary text-primary bg-primary/5' : 'border-border'
      )}
    >
      {label}
    </div>
  )
}
