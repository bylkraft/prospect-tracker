import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Contact } from '@/db/schema'
import {
  contactDisplayName,
  contactInitials,
  relationshipColorVar,
  relationshipLabel
} from '@/modules/contacts/utils/display'

type Props = {
  contact: Pick<Contact, 'firstName' | 'lastName' | 'company' | 'jobTitle' | 'relationship'>
  className?: string
  showSubtitle?: boolean
  showRelationship?: boolean
  size?: 'sm' | 'md'
  title?: React.ReactNode
  subtitle?: string
  badge?: React.ReactNode
}

export function ContactIdentity({
  contact,
  className,
  showSubtitle = true,
  showRelationship = false,
  size = 'sm',
  title,
  subtitle: subtitleOverride,
  badge
}: Props) {
  const name = contactDisplayName(contact)
  const subtitle =
    subtitleOverride ?? [contact.jobTitle, contact.company].filter(Boolean).join(' · ')
  const relationship = relationshipLabel(contact.relationship)

  const medallion = (
    <span className="relative flex-none">
      <span
        className={cn(
          'bg-secondary text-secondary-foreground flex items-center justify-center rounded-full font-semibold',
          size === 'md' ? 'size-9 text-xs' : 'text-2xs size-7'
        )}
      >
        {contactInitials(contact)}
      </span>
      {showRelationship ? (
        <span
          style={
            { '--stage-dot': relationshipColorVar(contact.relationship) } as React.CSSProperties
          }
          className={cn(
            'border-card absolute rounded-full border-2 bg-(--stage-dot)',
            size === 'md' ? '-right-px -bottom-px size-2.75' : '-right-0.5 -bottom-0.5 size-2.5'
          )}
        />
      ) : null}
    </span>
  )

  return (
    <span
      className={cn('flex min-w-0 items-center', size === 'md' ? 'gap-3' : 'gap-2.5', className)}
    >
      {showRelationship ? (
        <Tooltip>
          <TooltipTrigger
            render={<span aria-label={relationship} />}
            className="flex-none rounded-full"
          >
            {medallion}
          </TooltipTrigger>
          <TooltipContent>{relationship}</TooltipContent>
        </Tooltip>
      ) : (
        medallion
      )}
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold">{title ?? name}</span>
          {badge}
        </span>
        {showSubtitle && subtitle ? (
          <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
        ) : null}
      </span>
    </span>
  )
}
