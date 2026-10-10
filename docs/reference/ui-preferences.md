# UI preferences

Interface choices that should outlive a page — whether the sidebar is open, which view the
tracker opens on — live in **cookies**, all declared in `src/lib/preferences.ts`. That module is
the one place that knows their names, reads them and writes them.

## Why cookies

The server renders the first paint, so a preference it cannot see renders wrong first and
corrects itself after hydration: a collapsed sidebar that snaps open, a list that turns into a
board. A cookie travels with the request, so `getCookie` reads it during SSR and the first paint
is already right.

`localStorage` — and so a persisted client store such as Zustand — is invisible to the server and
would bring that flash back. A store would also be a third copy of state that already has an
owner: the tracker's display lives in the URL, the sidebar's in its provider. The cookie is only
persistence, never the state itself.

## One reader, two runtimes

`readPreference` is a `createIsomorphicFn`: `getCookie` on the server, `document.cookie` in the
browser. A loader or a `beforeLoad` calls it the same way whichever side runs it, with no server
round-trip on client navigations.

## One cookie per preference

Each preference has its own cookie rather than sharing a JSON blob. The sidebar's cookie is
written by `components/ui/sidebar.tsx`, a file the shadcn CLI owns and may regenerate, so its name
and format are fixed. A shared blob would also need every write to read, merge and rewrite it.
Declaring the names side by side in one module gives the single place without either cost.

## The tracker display

The tracker's view and hidden columns stay in the URL, which remains the source of truth: a reload,
a shared link or the back button keep them. What the URL cannot do is survive leaving the page —
`/app`, the post-login redirect and a typed address all land on a bare `/app/tracker`, and so
would a link built from the defaults. `tracker_display` covers that gap.

- **Written on an explicit choice only.** `setView` and `toggleField` store the resulting
  `{ view, hidden }`. Opening someone's link does not overwrite your own preference.
- **Applied on arrival only.** The route's `beforeLoad` fills `view` and `hidden` from the cookie
  when the URL leaves them at their default, then redirects. `stripSearchParams` drops defaults
  from the URL, so "at the default" and "absent" are the same thing; each field is filled on its
  own, so a link stating only the view still gets your hidden columns.
- It is skipped when `cause` is `stay` — a filter, tab or sort change on the page itself. Applying
  it there would turn a failed cookie write (cookies blocked) into a trap: picking the list would
  bounce straight back to the remembered board.
- **Links into the tracker carry it themselves.** The sidebar's Tracker link and its follow-up
  button build their search with `rememberedTrackerSearch`: they also work from the tracker, where
  `beforeLoad` stays out of the way, and must not drop the view while resetting the filters. The
  cookie reads the same on both sides, so the SSR `href` matches the hydrated one.
- **Parsed like the URL.** The cookie goes through the same schema as the search params, so an
  unknown view or column falls back field by field and a malformed value falls back entirely.

The redirect costs one extra round-trip on a hard load of a bare URL whose preference differs from
the default.

## Scope

Cookies are per browser, not per account: a preference set on a laptop does not follow to a
phone. Syncing them would mean a column on `users`, which no preference has needed yet.
