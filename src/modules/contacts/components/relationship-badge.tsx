import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ContactRelationship } from '@/db/schema'
import { relationshipColorVar, relationshipLabel } from '@/modules/contacts/utils/display'

type Props = React.ComponentProps<'span'> & { relationship: ContactRelationship }

export function RelationshipBadge({ relationship, className, ...props }: Props) {
  const style = {
    '--stage-dot': relationshipColorVar(relationship),
    ...props.style
  } as React.CSSProperties

  return (
    <Badge
      {...props}
      style={style}
      variant="secondary"
      className={cn(
        'gap-1.75 rounded-full border-(--stage-dot)/25 bg-(--stage-dot)/10 px-2.25 font-medium text-(--stage-dot)',
        className
      )}
    >
      {relationshipLabel(relationship)}
    </Badge>
  )
}
