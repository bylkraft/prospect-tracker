import { Bell, FilterX, Search, X } from 'lucide-react'
import { LayoutGroup } from 'motion/react'

import { Button } from '@/components/ui/button'
import { DebouncedInput } from '@/components/debounced-input'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ToggleIndicator } from '@/components/toggle-indicator'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { DisplayMenu } from '@/modules/opportunities/components/display-menu'
import { fieldLabels, hidableFieldsFor } from '@/modules/opportunities/utils/display-settings'
import { isStatusTab } from '@/modules/opportunities/utils/rows'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'

// Container-driven, not viewport-driven: the sidebar makes viewport breakpoints lie.
const TOOLBAR_LAYOUT =
  'border-border-soft @container flex flex-none flex-wrap items-center justify-between gap-4 border-b px-4.5 py-3.75'
const TABS_LAYOUT = 'flex grow basis-100 flex-wrap items-center gap-3 @4xl:basis-auto'
// Wraps until the toolbar can hold the tabs, the due chip and the search on one row.
const SEARCH_LAYOUT =
  'flex grow basis-100 items-center gap-2.5 justify-start @4xl:justify-end @4xl:basis-auto'

// Icon-only on a narrow toolbar so the search keeps its room; the label stays for screen readers.
const COLLAPSIBLE_LABEL = 'sr-only @lg:not-sr-only'

// Fixed so the skeleton matches exactly; `grow-0` stops `grow` overriding the width.
const TOGGLE_WIDTH = '@4xl:w-70 @4xl:grow-0'

// The `data-pressed` resets hand the selected background to the travelling pill, which the item
// must not also paint — see docs/reference/toggle-indicator.md
const TAB_ITEM =
  'relative isolate h-full flex-1 gap-1.5 rounded-[7px] px-3.25 font-semibold data-pressed:bg-transparent data-pressed:shadow-none data-pressed:hover:bg-transparent dark:data-pressed:ring-0'

type Props = {
  activeCount: number
  archivedCount: number
}

function TabCount({ value, isSelected }: { value: number; isSelected: boolean }) {
  return (
    <span
      className={cn(
        'text-muted-foreground rounded-full px-1.5 text-xs font-semibold tabular-nums',
        isSelected && 'bg-secondary'
      )}
    >
      {value}
    </span>
  )
}

export function OpportunitiesToolbar({ activeCount, archivedCount }: Props) {
  const {
    tab: statusTab,
    view,
    hiddenFields,
    search,
    isDueOnly,
    hasFilters,
    setTab,
    setSearch,
    setDueOnly,
    setView,
    toggleField,
    resetFilters
  } = useOpportunitiesFilters()

  const labels = fieldLabels()

  // Only what the current view draws — hiding a field it does not render would do nothing.
  const fields = hidableFieldsFor(view).map((id) => ({
    id,
    label: labels[id],
    isVisible: !hiddenFields.includes(id)
  }))

  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={TABS_LAYOUT}>
        <ToggleGroup
          value={[statusTab]}
          onValueChange={([next]) => {
            if (isStatusTab(next)) setTab(next)
          }}
          spacing={1}
          className={cn(
            'bg-secondary h-8.75 grow gap-0 rounded-[9px] border-none p-0.75',
            TOGGLE_WIDTH
          )}
        >
          <LayoutGroup id="opportunities-tabs">
            <ToggleGroupItem value="active" variant="selected" className={TAB_ITEM}>
              <ToggleIndicator groupId="opportunities-tabs" isSelected={statusTab === 'active'} />
              {m.table_tabActive({ count: activeCount })}
              <TabCount value={activeCount} isSelected={statusTab === 'active'} />
            </ToggleGroupItem>
            <ToggleGroupItem value="archived" variant="selected" className={TAB_ITEM}>
              <ToggleIndicator groupId="opportunities-tabs" isSelected={statusTab === 'archived'} />
              {m.table_tabArchived({ count: archivedCount })}
              <TabCount value={archivedCount} isSelected={statusTab === 'archived'} />
            </ToggleGroupItem>
          </LayoutGroup>
        </ToggleGroup>

        {isDueOnly && (
          <div className="bg-accent text-accent-foreground flex items-center gap-1.5 rounded-lg py-1 pr-1 pl-2.5 text-xs font-semibold">
            <Bell className="size-3.5" />
            {m.table_dueFilter()}
            <Button
              variant="ghost"
              size="icon-xs"
              title={m.table_clearDueFilter()}
              onClick={() => setDueOnly(false)}
              className="text-accent-foreground hover:bg-primary/15"
            >
              <X />
            </Button>
          </div>
        )}
      </div>

      <div className={SEARCH_LAYOUT}>
        <InputGroup className="bg-secondary h-9 grow @4xl:max-w-57.5">
          <InputGroupAddon>
            <Search className="size-3.75" />
          </InputGroupAddon>
          <DebouncedInput
            value={search}
            onChange={setSearch}
            placeholder={m.table_searchPlaceholder()}
          />
        </InputGroup>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasFilters}
          onClick={resetFilters}
          className="text-secondary-foreground h-9 flex-none gap-1.75 text-sm font-medium"
        >
          <FilterX />
          <span className={COLLAPSIBLE_LABEL}>{m.table_resetFilters()}</span>
        </Button>
        <DisplayMenu
          labelClassName={COLLAPSIBLE_LABEL}
          view={view}
          onViewChange={setView}
          fields={fields}
          onToggleField={toggleField}
        />
      </div>
    </div>
  )
}

export function OpportunitiesToolbarSkeleton() {
  return (
    <div className={TOOLBAR_LAYOUT}>
      <div className={TABS_LAYOUT}>
        <Skeleton className={cn('h-8.75 grow rounded-[9px]', TOGGLE_WIDTH)} />
      </div>
      <div className={SEARCH_LAYOUT}>
        <Skeleton className="h-9 grow @4xl:max-w-57.5" />
        <Skeleton className="size-9 flex-none @lg:w-21" />
        <Skeleton className="size-9 flex-none @lg:w-25" />
      </div>
    </div>
  )
}
