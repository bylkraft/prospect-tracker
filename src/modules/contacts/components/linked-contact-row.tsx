import { Link } from '@tanstack/react-router'
import { MoreHorizontal, Star, Unlink, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger
} from '@/components/ui/popover'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'
import { ContactIdentity } from '@/modules/contacts/components/contact-identity'
import type { LinkedContact } from '@/modules/contacts/contacts-types'

type Props = {
  contact: LinkedContact
  isPrimary: boolean
  onMakePrimary: () => void
  onUnlink: () => void
}

export function LinkedContactRow({ contact, isPrimary, onMakePrimary, onUnlink }: Props) {
  const subtitle = [contact.company, contact.phone ?? m.contact_noPhone()]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="border-border-soft flex items-center gap-3 border-b py-2.75 pr-2 pl-3.5 max-sm:py-3">
      <ContactIdentity
        contact={contact}
        size="md"
        showRelationship
        subtitle={subtitle}
        badge={isPrimary ? <PrimaryBadge /> : null}
        className="grow text-sm"
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground flex-none max-sm:size-11"
              aria-label={m.customize_moreActions()}
              title={m.customize_moreActions()}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-59">
          {isPrimary ? null : (
            <DropdownMenuItem onClick={onMakePrimary}>
              <Star />
              {m.contact_makePrimary()}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            render={
              <Link
                to={APP_ROUTES.contactDetail}
                params={{ contactId: contact.id }}
                target="_blank"
                rel="noopener"
              />
            }
          >
            <UserRound />
            {m.contact_openRecord()}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onUnlink}>
            <Unlink />
            {m.contact_unlink()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

function PrimaryBadge() {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        className="bg-primary/10 text-primary focus-visible:ring-ring/50 flex h-5 flex-none cursor-default items-center rounded-md px-1.75 text-xs font-semibold outline-none focus-visible:ring-3"
      >
        {m.contact_primaryBadge()}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="bg-foreground text-background w-59 rounded-lg px-2.5 py-2 text-xs leading-normal font-medium ring-0"
      >
        <PopoverDescription className="text-inherit">
          {m.contact_primaryTooltip()}
        </PopoverDescription>
      </PopoverContent>
    </Popover>
  )
}
