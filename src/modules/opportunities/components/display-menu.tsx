import { Columns3, LayoutGrid, List, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { m } from '@/i18n/paraglide/messages'
import {
  isView,
  type HidableField,
  type View
} from '@/modules/opportunities/utils/display-settings'

type Props = {
  labelClassName?: string
  view: View
  onViewChange: (view: View) => void
  fields: { id: HidableField; label: string; isVisible: boolean }[]
  onToggleField: (id: HidableField) => void
}

export function DisplayMenu({ labelClassName, view, onViewChange, fields, onToggleField }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-secondary-foreground h-9 flex-none gap-1.75 text-sm font-medium"
          />
        }
      >
        <Settings2 />
        <span className={labelClassName}>{m.display_menu()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.display_viewGroupLabel()}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={view}
            onValueChange={(next) => {
              if (isView(next)) onViewChange(next)
            }}
          >
            <DropdownMenuRadioItem value="list">
              <List />
              {m.display_viewList()}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="kanban">
              <LayoutGrid />
              {m.display_viewKanban()}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        {/* Both views: the table hides columns, the board hides lines on its cards. */}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-1.75">
            <Columns3 className="size-3.5" />
            {view === 'kanban' ? m.display_fieldsGroupLabel() : m.display_columnsGroupLabel()}
          </DropdownMenuLabel>
          {fields.map((field) => (
            <DropdownMenuCheckboxItem
              key={field.id}
              checked={field.isVisible}
              onCheckedChange={() => onToggleField(field.id)}
            >
              {field.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
