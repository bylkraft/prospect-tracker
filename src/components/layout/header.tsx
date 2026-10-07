import { Plus } from 'lucide-react'
import { useHydrated, useMatchRoute } from '@tanstack/react-router'

import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { LocaleSwitcher } from '@/components/layout/locale-switcher'
import { m } from '@/i18n/paraglide/messages'
import { APP_ROUTES } from '@/lib/routes'
import { useOpportunitiesSummary } from '@/modules/opportunities/hooks/use-opportunities'
import type { Stage } from '@/db/schema'
import { useStages } from '@/modules/stages/hooks/use-stages'
import { countStages } from '@/modules/stages/stages-utils'
import { useOpportunityEditorContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import {
  ContactBreadcrumb,
  ContactsHeaderAction,
  ContactsHeaderSubtitle
} from '@/modules/contacts/components/contacts-header-actions'
import { Skeleton } from '@/components/ui/skeleton'

function customizeSubtitle(stages: Stage[] | undefined) {
  if (!stages) return null

  const { active, archived } = countStages(stages)

  return archived > 0
    ? m.customize_subtitleArchived({ activeCount: active, archivedCount: archived })
    : m.customize_subtitle({ activeCount: active })
}

export function Header() {
  const { data: stages } = useStages()
  const { data, isPending } = useOpportunitiesSummary()
  const { openCreate } = useOpportunityEditorContext()
  // Shell data waits for hydration — see docs/reference/query-prefetching.md
  const isHydrated = useHydrated()

  const matchRoute = useMatchRoute()
  const isCustomize = matchRoute({ to: APP_ROUTES.customize }) !== false
  const isContacts = matchRoute({ to: APP_ROUTES.contacts }) !== false
  const contactMatch = matchRoute({ to: APP_ROUTES.contactDetail })
  const contactId = contactMatch === false ? null : contactMatch.contactId

  const isContactsSection = isContacts || contactId !== null

  const title = isCustomize
    ? m.customize_title()
    : isContacts
      ? m.contact_pageTitle()
      : m.nav_tracker()

  const subtitle = !isHydrated
    ? null
    : isCustomize
      ? customizeSubtitle(stages)
      : isPending || !data
        ? null
        : m.dashboard_activeOpportunities({ count: data.activeCount })

  return (
    <header className="border-border bg-card flex flex-none items-center justify-between gap-4 border-b px-6.5 py-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3.25">
        <SidebarTrigger
          variant="outline"
          size="icon-md"
          className="flex-none"
          title={m.header_toggleSidebar()}
        />
        {contactId !== null ? (
          <ContactBreadcrumb contactId={contactId} />
        ) : (
          <div className="flex min-w-0 flex-col justify-center gap-1.5">
            <h1 className="text-foreground font-heading tracking-page-title truncate text-lg leading-none font-semibold">
              {title}
            </h1>
            {isContacts ? (
              <ContactsHeaderSubtitle />
            ) : subtitle === null ? (
              <Skeleton className="h-3 w-18 md:w-32" />
            ) : (
              <span className="text-muted-foreground truncate text-xs leading-none">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-none items-center gap-2.25">
        <LocaleSwitcher />
        <ThemeToggle />
        {isContactsSection ? (
          <ContactsHeaderAction />
        ) : (
          <Button
            size="md"
            onClick={openCreate}
            className="font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <Plus />
            <span className="max-sm:sr-only">{m.header_newOpportunity()}</span>
          </Button>
        )}
      </div>
    </header>
  )
}
