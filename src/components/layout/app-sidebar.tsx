import { ListFilter, Users } from 'lucide-react'
import { Link, useHydrated, useMatchRoute } from '@tanstack/react-router'

import { CustomizeIcon } from '@/components/icons/customize'
import { BrandMark } from '@/components/icons/brand-mark'
import { ProfileMenu } from '@/modules/auth/components/profile-menu'
import { AppSidebarFooter } from '@/components/layout/app-sidebar-footer'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import { m } from '@/i18n/paraglide/messages'
import { CONFIG } from '@/lib/config'
import { APP_ROUTES } from '@/lib/routes'
import { CONTACTS_SEARCH_DEFAULTS } from '@/modules/contacts/contacts-schema'
import { OPPORTUNITIES_SEARCH_DEFAULTS } from '@/modules/opportunities/opportunities-schema'
import { useStartFollowUps } from '@/modules/opportunities/hooks/use-start-follow-ups'
import { StageBadge } from '@/modules/stages/components/stage-badge'
import { useStageCounts } from '@/modules/stages/hooks/use-stage-counts'
import { Skeleton } from '@/components/ui/skeleton'
import { AppSidebarFollowUp } from '@/components/layout/app-sidebar-follow-up'

export function AppSidebar() {
  const { activeStages, dueCount, doneToday, hasPipeline, isPending, skeletonCount } =
    useStageCounts()
  const startFollowUps = useStartFollowUps()
  // Shell data waits for hydration — see docs/reference/query-prefetching.md
  const isLoaded = useHydrated() && !isPending
  const { isMobile, setOpenMobile } = useSidebar()

  // On mobile the sidebar is a drawer: anything that navigates or starts an action has to close it
  const closeDrawer = () => {
    if (isMobile) setOpenMobile(false)
  }

  const matchRoute = useMatchRoute()
  const isTracker = matchRoute({ to: APP_ROUTES.tracker }) !== false
  const isCustomize = matchRoute({ to: APP_ROUTES.customize }) !== false
  const isContacts = matchRoute({ to: APP_ROUTES.contacts, fuzzy: true }) !== false

  return (
    <Sidebar>
      <SidebarHeader className="gap-0 p-0 px-4 pt-4.5">
        <div className="flex items-center gap-2.75 px-1.5 pt-1.5 pb-5">
          <div className="bg-primary text-primary-foreground flex size-8.5 flex-none items-center justify-center rounded-lg">
            <BrandMark className="size-7.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground text-md font-heading tracking-title font-semibold">
              {CONFIG.brand}
            </span>
            <span className="text-muted-foreground text-xs">{m.common_tagline()}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-4">
        <SidebarGroup className="shrink-0 p-0">
          <SidebarMenu className="gap-0.75">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isTracker}
                onClick={closeDrawer}
                render={<Link to={APP_ROUTES.tracker} search={OPPORTUNITIES_SEARCH_DEFAULTS} />}
              >
                <ListFilter />
                {m.nav_tracker()}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isContacts}
                onClick={closeDrawer}
                render={<Link to={APP_ROUTES.contacts} search={CONTACTS_SEARCH_DEFAULTS} />}
              >
                <Users />
                {m.nav_contacts()}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isCustomize}
                onClick={closeDrawer}
                render={<Link to={APP_ROUTES.customize} />}
              >
                <CustomizeIcon />
                {m.nav_customize()}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-5.5 min-h-0 shrink-0 px-2.75 py-0">
          <SidebarGroupLabel>{m.nav_pipeline()}</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0">
            {!isLoaded
              ? Array.from({ length: skeletonCount }, (_, index) => (
                  <Skeleton key={index} className="my-1.5 h-5 w-53 rounded-sm" />
                ))
              : activeStages.map((stage) => (
                  <div
                    key={stage.id}
                    className="text-secondary-foreground flex items-center justify-between py-1.25 text-xs"
                  >
                    <StageBadge variant="plain" name={stage.name} color={stage.color} />
                    <span className="text-muted-foreground font-medium tabular-nums">
                      {stage.count}
                    </span>
                  </div>
                ))}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6.5 shrink-0 px-2.75 py-0">
          <SidebarGroupLabel>{m.nav_followUps()}</SidebarGroupLabel>
          <SidebarGroupContent>
            <AppSidebarFollowUp
              dueCount={isLoaded ? dueCount : undefined}
              doneToday={isLoaded ? doneToday : undefined}
              hasPipeline={hasPipeline}
              onStart={() => {
                closeDrawer()
                startFollowUps()
              }}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-0 p-0 px-4 py-4.5">
        <AppSidebarFooter />
        <Separator className="my-1.75 mr-2.75 w-auto!" />
        <ProfileMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
