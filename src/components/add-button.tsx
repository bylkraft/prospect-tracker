import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
}

export function AddButton({ label, onClick, disabled, className }: Props) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'border-border hover:border-primary/45 hover:text-accent-foreground h-11 border-dashed font-semibold',
        className
      )}
    >
      <Plus />
      {label}
    </Button>
  )
}
