import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'

import { FormField } from '@/components/form/form-field'
import { useFieldContext } from '@/components/form/form-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { m } from '@/i18n/paraglide/messages'
import { LiveRegion } from '@/shared/sortable/components/live-region'
import { ReorderMenuItems } from '@/shared/sortable/components/reorder-menu-items'
import { DragHandle, DropIndicator } from '@/shared/sortable/components/sortable-row'
import { useAnnounce } from '@/shared/sortable/hooks/use-announce'
import { rowIds } from '@/shared/sortable/sortable-row-ids'
import { useSortableItem, useSortableList } from '@/shared/sortable/hooks/use-sortable-list'
import { moveInList, moveToEdge } from '@/shared/sortable/sortable-utils'

type Option = { id: string; name: string }

type Entry = { value: string; label: string | null }

type Props = {
  label: string
  placeholder?: string
  type?: 'text' | 'tel' | 'email'
  addLabel: string
  removeLabel: string
  labelOptions: Option[]
  labelPlaceholder: string
  unlabelledLabel: string
  primaryLabel: string
  reorderHint: string
  maxEntries: number
  tabular?: boolean
  className?: string
}

export function EntryListField({
  label,
  placeholder,
  type = 'text',
  addLabel,
  removeLabel,
  labelOptions,
  labelPlaceholder,
  unlabelledLabel,
  primaryLabel,
  reorderHint,
  maxEntries,
  tabular,
  className
}: Props) {
  const field = useFieldContext<Entry[]>()
  const entries: Entry[] =
    field.state.value.length > 0 ? field.state.value : [{ value: '', label: null }]
  const isTouched = field.state.meta.isTouched

  const rowErrors = entryErrors(field.form.state.errorMap, field.name, entries.length)

  const write = (next: Entry[]) => field.handleChange(next)
  const replace = (index: number, patch: Partial<Entry>) =>
    write(entries.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)))

  const hasSeveral = entries.length > 1

  const ids = rowIds(field.name, entries.length)
  const { message, announce } = useAnnounce()

  const commit = (next: Entry[], from: number, to: number) => {
    write(next)

    const moved = next[to]
    if (!moved) return

    announce(
      m.sortable_reorderAnnounce({
        name: moved.value.trim() || `${label} ${from + 1}`,
        position: to + 1,
        total: next.length
      })
    )
  }

  const move = (index: number, direction: -1 | 1) => {
    const to = index + direction
    if (to < 0 || to >= entries.length) return

    commit(moveInList(entries, index, direction), index, to)
  }

  const moveTo = (index: number, edge: 'top' | 'bottom') =>
    commit(moveToEdge(entries, index, edge), index, edge === 'top' ? 0 : entries.length - 1)

  useSortableList({
    listId: field.name,
    ids,
    onReorder: (nextIds, movedId) => {
      const from = ids.indexOf(movedId)
      const to = nextIds.indexOf(movedId)
      if (from < 0 || to < 0) return

      commit(
        nextIds.map((id) => entries[ids.indexOf(id)]).filter((entry) => entry !== undefined),
        from,
        to
      )
    }
  })

  return (
    <FormField label={label} className={className}>
      <div className="flex flex-col gap-2">
        {entries.map((entry, index) => (
          <EntryRow
            key={ids[index]}
            listId={field.name}
            rowId={ids[index] ?? ''}
            index={index}
            isFirst={index === 0}
            isLast={index === entries.length - 1}
            hasSeveral={hasSeveral}
            entry={entry}
            fieldName={field.name}
            fieldId={index === 0 ? field.name : undefined}
            label={label}
            placeholder={placeholder}
            type={type}
            error={isTouched ? rowErrors[index] : undefined}
            tabular={tabular}
            labelOptions={labelOptions}
            labelPlaceholder={labelPlaceholder}
            unlabelledLabel={unlabelledLabel}
            primaryLabel={primaryLabel}
            removeLabel={removeLabel}
            canRemove={!(entries.length === 1 && entry.value === '')}
            onBlur={field.handleBlur}
            onValueChange={(value) => replace(index, { value })}
            onLabelChange={(next) => replace(index, { label: next })}
            onMove={(direction) => move(index, direction)}
            onMoveToTop={() => moveTo(index, 'top')}
            onMoveToBottom={() => moveTo(index, 'bottom')}
            onRemove={() => {
              const next = entries.filter((_, at) => at !== index)
              write(next.length > 0 ? next : [{ value: '', label: null }])
            }}
          />
        ))}

        <div className={cn('flex flex-wrap items-center gap-x-2.5 gap-y-2', hasSeveral && 'pl-8')}>
          {entries.length < maxEntries ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => write([...entries, { value: '', label: null }])}
              className="border-input hover:bg-secondary h-8 w-fit gap-1.75 rounded-[9px] border border-dashed px-2.75 text-[13px] font-normal"
            >
              <Plus className="text-muted-foreground size-3.25" />
              {addLabel}
            </Button>
          ) : null}
          {hasSeveral ? <span className="text-muted-foreground text-xs">{reorderHint}</span> : null}
        </div>
      </div>

      <LiveRegion message={message} />
    </FormField>
  )
}

type RowProps = {
  listId: string
  rowId: string
  index: number
  isFirst: boolean
  isLast: boolean
  hasSeveral: boolean
  entry: Entry
  fieldName: string
  fieldId: string | undefined
  label: string
  placeholder: string | undefined
  type: 'text' | 'tel' | 'email'
  error: string | undefined
  tabular: boolean | undefined
  labelOptions: Option[]
  labelPlaceholder: string
  unlabelledLabel: string
  primaryLabel: string
  removeLabel: string
  canRemove: boolean
  onBlur: () => void
  onValueChange: (value: string) => void
  onLabelChange: (label: string | null) => void
  onMove: (direction: -1 | 1) => void
  onMoveToTop: () => void
  onMoveToBottom: () => void
  onRemove: () => void
}

function EntryRow({
  listId,
  rowId,
  index,
  isFirst,
  isLast,
  hasSeveral,
  entry,
  fieldName,
  fieldId,
  label,
  placeholder,
  type,
  error,
  tabular,
  labelOptions,
  labelPlaceholder,
  unlabelledLabel,
  primaryLabel,
  removeLabel,
  canRemove,
  onBlur,
  onValueChange,
  onLabelChange,
  onMove,
  onMoveToTop,
  onMoveToBottom,
  onRemove
}: RowProps) {
  const { ref, handleRef, isDragging, closestEdge } = useSortableItem(listId, rowId, index)

  return (
    <div className="flex flex-col gap-1.25">
      <div
        ref={ref}
        className={cn(
          'relative flex items-center gap-2 transition-opacity',
          isDragging && 'opacity-40'
        )}
      >
        <DropIndicator edge={closestEdge} />

        {hasSeveral ? <DragHandle ref={handleRef} label={m.sortable_dragHandle()} /> : null}

        <div
          className={cn(
            'border-input bg-secondary has-[input:focus-visible]:ring-ring/50 flex min-w-0 flex-1 flex-col gap-1.75 rounded-[10px] border px-2.75 py-2.25 has-[input:focus-visible]:ring-[3px]',
            '@md:h-10.5 @md:flex-row @md:items-center @md:gap-2 @md:rounded-[9px] @md:py-0 @md:pr-1.25 @md:pl-3',
            error && 'border-destructive has-[input:focus-visible]:ring-destructive/20'
          )}
        >
          <Input
            id={fieldId}
            name={`${fieldName}.${index}.value`}
            type={type}
            value={entry.value}
            placeholder={placeholder}
            aria-label={`${label} ${index + 1}`}
            aria-invalid={error !== undefined}
            onBlur={onBlur}
            onChange={(event) => onValueChange(event.target.value)}
            className={cn(
              'h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0',
              tabular && 'tabular-nums'
            )}
          />

          <div className="flex items-center gap-1.75 @md:contents">
            {isFirst && hasSeveral ? (
              <span className="bg-primary/10 text-primary flex-none rounded-md px-2.25 py-0.75 text-[11.5px] font-semibold">
                {primaryLabel}
              </span>
            ) : null}

            <Select
              name={`${fieldName}.${index}.label`}
              value={entry.label}
              onValueChange={(next: string | null) => onLabelChange(next)}
            >
              <SelectTrigger
                size="sm"
                aria-label={`${label} ${index + 1} — ${labelPlaceholder}`}
                className={cn(
                  'bg-card dark:bg-card h-8 w-fit flex-none gap-1.5 rounded-[7px] border px-2.5 text-[12.5px]',
                  'dark:hover:bg-card',
                  'data-[popup-open]:border-primary',
                  entry.label ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <SelectValue placeholder={labelPlaceholder}>
                  {(selected: string | null) =>
                    labelOptions.find((option) => option.id === selected)?.name ?? labelPlaceholder
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null} className="text-muted-foreground">
                  {unlabelledLabel}
                </SelectItem>
                {labelOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasSeveral ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground flex-none"
                  aria-label={m.customize_moreActions()}
                  title={m.customize_moreActions()}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-46.5">
              <ReorderMenuItems
                isFirst={isFirst}
                isLast={isLast}
                onMoveToTop={onMoveToTop}
                onMove={onMove}
                onMoveToBottom={onMoveToBottom}
              />
              <DropdownMenuItem variant="destructive" onClick={onRemove}>
                <Trash2 />
                {removeLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={removeLabel}
            disabled={!canRemove}
            onClick={onRemove}
            className={cn(
              'hover:text-destructive size-9 flex-none rounded-[9px]',
              isFirst ? 'bg-secondary text-foreground' : 'text-muted-foreground'
            )}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      {error ? (
        <span className={cn('text-destructive text-xs', hasSeveral && 'pl-8')}>{error}</span>
      ) : null}
    </div>
  )
}

function entryErrors(errorMap: Record<string, unknown>, name: string, count: number) {
  const byPath = errorMap.onChange

  return Array.from({ length: count }, (_, index) =>
    firstIssueMessage(isRecord(byPath) ? byPath[`${name}[${index}].value`] : undefined)
  )
}

function firstIssueMessage(issues: unknown) {
  const [first]: unknown[] = Array.isArray(issues) ? issues : []

  return isRecord(first) && typeof first.message === 'string' ? first.message : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
