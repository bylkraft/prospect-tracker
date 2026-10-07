import { FilterX, Search, X } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { DebouncedInput } from '@/components/debounced-input'
import { SkeletonText } from '@/components/skeleton-text'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { CONTACT_RELATIONSHIPS, type ContactRelationship } from '@/db/schema'
import { cn } from '@/lib/utils'
import { useContactsFilters } from '@/modules/contacts/hooks/use-contacts-filters'
import { relationshipColorVar, relationshipLabel } from '@/modules/contacts/utils/display'

const TOOLBAR_LAYOUT = 'flex flex-none flex-col'
const SEARCH_ROW = 'flex items-center gap-3.5 px-4.5 pt-4'
const CHIP = 'h-7 flex-none gap-1.75 rounded-full px-3 text-xs font-medium'
const CHIP_ROW =
  'border-border-soft flex flex-wrap items-center gap-2 border-b px-4.5 pt-3.5 pb-3.75'

type Props = {
  relationshipCounts: Record<ContactRelationship, number>
  searchTotal: number
  total: number
}

export function ContactsToolbar({ relationshipCounts, searchTotal, total }: Props) {
  const { search, relationship, hasFilters, setSearch, setRelationship, resetFilters } =
    useContactsFilters()

  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={SEARCH_ROW}>
        <InputGroup className="bg-secondary h-11.5 grow rounded-xl">
          <InputGroupAddon>
            <Search className="size-4.5" />
          </InputGroupAddon>
          <DebouncedInput
            value={search}
            onChange={setSearch}
            placeholder={m.contact_searchPlaceholder()}
            className="text-[15px]"
          />
        </InputGroup>
      </div>

      <div className={CHIP_ROW}>
        <RelationshipChip
          isActive={relationship === ''}
          onClick={() => setRelationship('')}
          label={m.contact_allRelationships()}
          count={searchTotal}
        />
        {CONTACT_RELATIONSHIPS.map((value) => (
          <RelationshipChip
            key={value}
            isActive={relationship === value}
            onClick={() => setRelationship(relationship === value ? '' : value)}
            label={relationshipLabel(value)}
            color={relationshipColorVar(value)}
            count={relationshipCounts[value]}
          />
        ))}

        <div className="flex flex-1 items-center justify-end gap-2">
          <span className="text-muted-foreground text-xs tabular-nums">
            {m.contact_resultCount({ count: total })}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasFilters}
            onClick={resetFilters}
            className="text-secondary-foreground h-7 flex-none gap-1.75 rounded-full px-3 text-xs font-medium"
          >
            <FilterX className="size-3.25" />
            {m.table_resetFilters()}
          </Button>
        </div>
      </div>
    </div>
  )
}

type ChipProps = {
  isActive: boolean
  onClick: () => void
  label: string
  count: number
  color?: string
}

function RelationshipChip({ isActive, onClick, label, count, color }: ChipProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-pressed={isActive}
      style={color ? ({ '--stage-dot': color } as React.CSSProperties) : undefined}
      className={cn(
        CHIP,
        isActive && 'bg-foreground text-background border-transparent font-semibold'
      )}
    >
      {color ? <span className="size-1.75 flex-none rounded-full bg-(--stage-dot)" /> : null}
      {label}
      <span className="tabular-nums opacity-70">{count}</span>
      {isActive && color ? <X className="size-3 opacity-65" /> : null}
    </Button>
  )
}

export function ContactsToolbarSkeleton() {
  const chip = cn(buttonVariants({ variant: 'outline', size: 'sm' }), CHIP, 'border-transparent')

  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={SEARCH_ROW}>
        <Skeleton className="h-11.5 grow rounded-xl" />
      </div>
      <div className={CHIP_ROW}>
        {[m.contact_allRelationships(), ...CONTACT_RELATIONSHIPS.map(relationshipLabel)].map(
          (label) => (
            <SkeletonText key={label} className={chip}>
              {label} 0
            </SkeletonText>
          )
        )}
      </div>
    </div>
  )
}
