import { KpiBand } from '@/modules/opportunities/components/kpi-band'
import { OpportunitiesTable } from '@/modules/opportunities/components/opportunities-table'
import { OpportunitiesToolbar } from '@/modules/opportunities/components/opportunities-toolbar'
import { m } from '@/i18n/paraglide/messages'
import { useDemoTracker } from '@/modules/landing/hooks/use-demo-tracker'

const PANEL_CARD_LAYOUT =
  'bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'

/**
 * The real tracker, running on fabricated rows. Everything a visitor clicks — sorting, search,
 * pinning, tabs, pagination — is the dashboard's own component, so the two cannot drift.
 */
export function LandingTrackerDemo() {
  const demo = useDemoTracker()

  return (
    <div>
      <KpiBand
        kpis={{
          dueToday: demo.dueCount,
          stale: 9,
          interviews: 5,
          responseRate: 41
        }}
      />

      <div className={PANEL_CARD_LAYOUT}>
        <OpportunitiesToolbar
          activeCount={demo.activeCount}
          archivedCount={demo.archivedCount}
          filters={demo.filters}
        />
        <OpportunitiesTable
          rows={demo.rows}
          filters={demo.filters}
          total={demo.total}
          servedPage={demo.servedPage}
          pageCount={demo.pageCount}
          isFetching={false}
          dailyRateReference={demo.dailyRateReference}
          onTogglePin={demo.togglePin}
          onEdit={() => {}}
          onToggleArchive={demo.toggleArchive}
          onDelete={demo.remove}
          emptyTitle={demo.filters.hasFilters ? m.table_noResults() : m.table_empty()}
          emptyHint={m.table_emptyHint()}
        />
      </div>
    </div>
  )
}
