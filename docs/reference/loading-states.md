# Loading states

A fresh signup used to land on a blank body for ~1.5s. This documents what fixed part of it,
and why the obvious fix for the rest does not work.

## `defaultPendingMs` on the router

TanStack Router waits `defaultPendingMs` (**1000ms by default**) before showing a route's
`pendingComponent`, then keeps it up for at least `defaultPendingMinMs` (500ms by default). With
a ~1.5s load that means a second of nothing, then a skeleton flash right before the content — the
worst of both. `src/router.tsx` lowers those values to **150ms** and **300ms** respectively: low
enough to feel immediate, high enough that cached navigations do not flicker.

This covers the route fallbacks for both `/_authed/app` and `/_authed/app/customize`. Their
loaders never await their prefetches — on the server either, where pending queries are streamed
to the client as they resolve — so cold query data is represented by the components' own
`QueryGate` skeletons. Router pending durations do not apply to those: a `QueryGate` skeleton
disappears as soon as its data arrives. See [`query-prefetching.md`](query-prefetching.md).

## Why `_authed` has no `pendingComponent`

The first-login window is the parents' `beforeLoad`, which runs before any layout exists:

| Step                                                                     | Where                | Cost                              |
| ------------------------------------------------------------------------ | -------------------- | --------------------------------- |
| identity — `supabase.auth.getClaims()`                                   | `__root.beforeLoad`  | local, no round-trip after SSR    |
| `provisionUser()` — insert user + stages + job types + experience levels | `_authed.beforeLoad` | one transaction, first login only |

`getUserFromServer` used to call `supabase.auth.getUser()` and pay a network round-trip on every
navigation — the
search box's debounced keystrokes included. Verifying the signature locally took it from ~71 ms
to ~3 ms (dev-local, same session). DEV-53 then moved that verification into the browser
altogether, so route-to-route navigation no longer waits for a server-function invocation at
all. See [`auth.md`](auth.md).

Giving `_authed` a `pendingComponent` that renders `AppShell` looks like the fix. **It crashes.**

A `pendingComponent` is a Suspense fallback: the match throws its `loadPromise`, so React renders
the fallback _instead of_ the route subtree. While it is up, `/_authed` and `/_authed/app` have
no active match — and `AppShell` is built entirely from components that need one:

- `AppSidebar` → `useOpportunitiesFilters` → `useSearch({ from: '/_authed/app' })`
- `ProfileMenu` → `useRouteContext({ from: '/_authed' })`

Both throw `Invariant failed: Could not find an active match`, and the root `errorComponent`
takes over — a full error screen instead of a skeleton. Rendering the shell during its own
pending state is circular: the shell _is_ what the route context feeds.

Making those hooks tolerate a missing match (`shouldThrow: false`, defaults) would spread
route-optional branches through shared components to serve one loading frame. Not worth it.

## The submit button owns that window instead

Since no route can render during the parents' `beforeLoad`, the only surface still mounted is
the page the user just left: the login form. So the sign-in and sign-up buttons stay in their
`loading` state until the navigation actually lands.

Both forms previously fired their post-submit work without awaiting it:

```ts
onSubmit: () => {
  router.invalidate() // returns a promise, dropped
  router.navigate({ to: next })
}
```

`isSubmitting` therefore flipped back to `false` as soon as `onSubmit` returned — the spinner
died while `getUserFromServer` and `provisionUser` were still running, which is what produced the blank
gap. Awaiting both keeps `isSubmitting` true across the whole transition, so the button spins
until the dashboard is on screen.

Measured on a first login (the `provisionUser` path): at 1000ms the URL is already `/app/tracker` while
the submit button still reports `disabled: true` with its spinner mounted; the dashboard paints
shortly after. The gap is covered by a control the user is already looking at.

Moving `provisionUser` out of `beforeLoad` — into the auth callback or a Postgres
`on auth.users insert` trigger — would remove the latency rather than cover it, but it splits
provisioning from the path that depends on it, and guest-mode migration assumes the user row
exists by the time the dashboard loads. Its own pass, if the delay ever justifies it.
