# Query prefetching

## The problem

A route loader that prefetches `useQuery` data has to build **exactly** the query key the
component will build. Nothing enforces that. When the two derivations drift, the prefetch writes
to a key nobody reads: the cache entry is orphaned, the component starts its own fetch on mount,
and the page shows a skeleton anyway. TypeScript stays silent throughout — the only symptom is
a request waterfall.

Background: [Reliable Query Prefetching with TanStack
Router](https://tkdodo.eu/blog/reliable-query-prefetching-with-tanstack-router).

## The rule

**Anything parameterised by the URL uses the same pure input derivation in the loader and its
component hook.** The `queryOptions` factories remain the single source of truth for query keys.
Routing them through the route `context` was tried and removed: no component ever read them from
there, so it was a second derivation site with no consumer.

`/app/tracker` does this for the three queries that actually cost something:

- `opportunitiesOptions` — the table page
- `summaryOptions` — the KPI band and the header
- `stageCountsOptions` — the sidebar

`loaderDeps` passes the validated URL state to the loader whenever it changes. Without it, paging
or searching would keep prefetching page 1. It leaves out `hidden`, the display menu's column
visibility: it changes how rows are drawn, not which rows are fetched, and keeping it would re-run
the loader — every prefetch included — on each checkbox click. `view` stays, since it picks which
of the table page or the board gets prefetched.

The derivation itself lives in `src/modules/opportunities/utils/search-input.ts` as pure
functions (`toOpportunitiesInput`, `toDueOnly`). `useOpportunitiesInput` and
`useOpportunitiesFilters` call the same functions — that shared call is the guarantee, not a
convention to remember.

Reference queries that take no argument (`stagesQueryOptions()`, `jobTypesQueryOptions()`) stay
inline in the loader. They cannot diverge, so another derivation layer would be ceremony.

## prefetchQuery, not ensureQueryData

Every route query starts with `prefetchQuery`, and **nothing awaits it — on the server either**.
The loader lets the route resolve immediately and `QueryGate` renders a skeleton until the data
lands. Awaiting would delay the destination shell without removing a single loading state.

Not awaiting on the server looks wrong at first — surely the HTML then ships with empty
skeletons? It does not, and the reason is `setupRouterSsrQueryIntegration` in `src/router.tsx`.
It subscribes to the `QueryCache` and **streams each query to the client as it resolves**, after
the initial dehydration. Pending prefetches are not lost; they arrive over that stream and
hydrate progressively. Awaiting them in the loader only replaces streaming with blocking.

This was got wrong once already: an `if (typeof window === 'undefined') await Promise.all(...)`
was added to both loaders to avoid a hydration mismatch that cannot happen. A mismatch means
server and client disagree on the **first** render; here the client hydrates from the same
dehydrated cache the server rendered from, so both start at the same skeleton and the streamed
data triggers an ordinary re-render. The branch only put the DEV-53 freeze back on the cold
start.

That holds for the routes, which are `ssr: 'data-only'`: their components never render on the
server, so there is nothing to hydrate. It does **not** hold for the shell — the header and the
sidebar are server-rendered and read the same queries. When a streamed query lands in the cache
before React hydrates, the client's first render shows the data where the server rendered the
skeleton, and React throws a hydration mismatch. So every data-driven part of the shell treats
"not hydrated yet" as pending (`useHydrated()` from the router): server and first client render
both show the skeleton, and the data follows on the next render.

## Why the loaders await nothing

Neither `/app/tracker` nor `/app/customize` awaits anything in its loader: every query is fired with
`prefetchQuery` and the route commits on the same tick as the click. Every consumer already
renders a skeleton while its query is pending — `QueryGate` in both panels, a `stages ? … : null`
guard in `opportunity-editor-provider.tsx`, an early return in `header.tsx`.

This matters more than it looks. An `await` in a loader delays the router's commit to the
destination route, and until that commit there is no pending route, so `defaultPendingMs` has
nothing to attach to: the user sees the _old_ page, fully interactive, with no feedback at all.
That was one half of the production symptom in DEV-53 — click, nothing, then the page appears.
The other half was the root `beforeLoad` awaiting a server round-trip for the identity before the
child route could even enter its pending phase; that one is gone for a different reason, see
[`auth.md`](auth.md).

`defaultPendingMinMs` applies only to router `pendingComponent` fallbacks. It does not hold a
`QueryGate` skeleton on screen; query-backed skeletons disappear as soon as their data arrives.

Measuring this locally does not work, and it is worth knowing why before someone tries. Local
server-fn calls take ~20 ms against ~150–450 ms in production, and on repeat navigation the
queries are already cached so nothing is requested at all. Throttling `window.fetch` does not
help either: TanStack's server-fn client does not go through it. The verification for this
behaviour is a production or preview deploy, not `pnpm dev`.

## The `today` caveat

`summaryOptions` and `stageCountsOptions` take `today` in their key, and `today` is the
**browser's** day (see `docs/reference/today.md`). During SSR the loader can only use the
server's day.

When the two differ — a user whose local date is ahead of or behind the server's — the
server-side prefetch lands under a key the client never reads, and the client refetches once on
mount. That is exactly the behaviour we had before prefetching existed, so the fallback is a
no-op rather than a regression, and it costs one extra request for a small slice of users. We
accepted that instead of restricting the prefetch to the client.
