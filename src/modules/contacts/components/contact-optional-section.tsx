import { Plus } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  hint?: string
  children: React.ReactNode
}

export function ContactOptionalSection({ label, hint, children }: Props) {
  return (
    <Collapsible>
      <CollapsibleTrigger
        className={cn(
          'border-input hover:bg-secondary flex h-11.5 w-full items-center gap-2.75 rounded-[10px] border px-3.5 text-left transition-colors',
          'focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:outline-none',
          'data-[panel-open]:hidden'
        )}
      >
        <Plus className="text-muted-foreground size-3.75 flex-none" />
        <span className="flex-1 text-[13.5px]">{label}</span>
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
