# Landing page

The public page at `/` is served by the same TanStack Start app as the dashboard. Most of it is
presentational, but the hero product shot is **the real tracker**, not a mock-up of one.

## The demo runs the dashboard's own components

`landing-tracker-demo.tsx` renders `KpiBand`, `OpportunitiesToolbar` and `OpportunitiesTable` —
the same components `/app` renders. A visitor can sort by column, search, pin a row, switch
between Actives and Archivées, and page through results, all without an account.

This is deliberate: a hand-drawn copy of the table drifts from the product the moment either
side changes, and the landing page then advertises something that no longer exists. Reusing the
components makes drift impossible.

## Why the filter state is injected

`OpportunitiesTable` and `OpportunitiesToolbar` used to call `useOpportunitiesFilters()`
directly. That hook reads the URL through `useSearch({ from: Route.id })`, where `Route` is
`_authed/app` — a route that does not exist in the public page's tree, so calling it there
throws.

Both components now take a `filters: OpportunitiesFilters` prop instead
(`opportunities-filters.ts` holds the contract):

- the dashboard passes `useOpportunitiesFilters()`, backed by the URL;
- the landing page passes `useDemoTracker().filters`, backed by `useState`.

`useOpportunitiesFilters` is annotated with the return type, so a change to the hook that breaks
the contract fails at compile time rather than at runtime on the public page.

## Where the demo's data comes from

`demo-rows.ts` holds fabricated `OpportunityRow` values — the real domain shape, including the
`stage` relation and the `isDue` / `isArchivedRow` flags the SQL normally computes. Names and
companies are fictional.

`use-demo-tracker.ts` mirrors client-side what the server does in SQL: tab scoping, the due
filter, search, sorting and pagination. Two rules there exist only to match the backend and are
easy to break by accident:

- **Search**: terms AND-ed, columns OR-ed, both sides unaccented — mirrors `searchMatch()` in
  `opportunities-sql.ts`, so `decathlon` finds `Décathlon`.
- **Sorting**: pinned rows lead every sort, matching the SQL `order by is_pinned desc` prefix.

If either rule changes server-side, change it here too — otherwise the demo teaches visitors
behaviour the product does not have.

## Layout note

The demo frame is wider than the page's 1160px grid (`max-w-[1290px]`) and the sidebar hides
below `xl`, because the real table carries nine columns and would otherwise clip. The rest of
the page stays on the 1160px grid.
