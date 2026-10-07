import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const COPIED_FEEDBACK_MS = 1600

type Props = {
  value: string
  label: string
  className?: string
}

export function CopyButton({ value, label, className }: Props) {
  const [isCopied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cn(
        'text-muted-foreground hover:text-foreground flex-none rounded-lg',
        isCopied && 'text-primary hover:text-primary',
        className
      )}
    >
      {isCopied ? <Check /> : <Copy />}
    </Button>
  )
}
