# Server-side table

The opportunities table filters, sorts and paginates **in SQL**. The client renders the
page it is handed and never reduces a row set itself.

Three rules follow from that, and most of the surprising code in the module is one of
them being enforced.

## 1. The URL is the view state

`tab`, `q`, `due`, `sort`, `page` and `perPage` live in the query string — nowhere else.
A filtered table survives a refresh, and any view is shareable as a link.

[`opportunitiesSearchSchema`](../../src/modules/opportunities/opportunities-schema.ts) is
the single entry point. Everything downstream reads a typed object, never a raw string.

Every field uses `.catch()` rather than `.default()`. `.default()` only fills in a
_missing_ param and **throws** on a malformed one, which surfaces as a route error rather
than a fallback. A hand-edited URL is expected input here, not an exception.

`sort` travels as `column:direction` and is normalised in the schema: an unknown column or
a malformed direction becomes `''`. Validating at the point of use instead would let the
bad value survive in the URL and travel through every subsequent navigation.

The route's `stripSearchParams` middleware then removes any param still equal to its
default on the way out, so an unfiltered table reads `/app/tracker` rather than
`/app?tab=active&page=1&…`.

`resetFilters` writes the defaults back for `q` and `due` only — the tab and the sort are
how the user is _looking_ at the table, not a filter narrowing it, so a reset leaves them
alone. Combined with the middleware above, one click takes a filtered view back to `/app/tracker`.

### The search box is debounced, so its value is not the URL's

Typing lives in a local draft inside
[`DebouncedInput`](../../src/components/debounced-input.tsx) and reaches the URL once the
user pauses — otherwise every keystroke would be a navigation and a query.

That draft has to follow the URL back when something else changes it (the reset button,
a back navigation, a shared link). It does that **during render**, rather than in an effect:
an effect would fire again on our own debounced emission and re-render the input a second
time per search. `react-hooks/set-state-in-effect` enforces this.

#### Only external changes win over the draft

Following the URL back is not enough on its own, because our own emission also comes back
that way — and it arrives late. Type `jean`, wait for the debounce to fire, then select-all
and type `ines`: the navigation for `jean` resolves while the draft already reads `ines`,
and a component that accepted every incoming prop would overwrite the draft with the stale
value. That was the `jeanines` bug.

So the input tracks the last value it **emitted** and ignores the prop while it is merely
catching up to that echo. Only a value it never emitted — reset filters, a back navigation,
a shared link — replaces the draft. The 300 ms debounce was never the problem and is
unchanged.

#### Terms are AND-ed, columns OR-ed, everything unaccented

`searchMatch` splits the query on whitespace and requires **every** term to match **some**
column. A single `ILIKE '%thomas devoteam%'` only matched a literal substring of one column, so
`thomas devoteam` returned nothing even with Thomas as recruiter and Devoteam as ESN — measured
0 rows before, 1 after. Reversed order (`vasseur thomas`) and repeated spaces fall out of the
same change.

The trade-off: the search is now more permissive. `thomas edf` matches a row where Thomas is the
recruiter and EDF the end client, which is the point, but short terms can pair up in ways the
user did not picture. The 200-character cap on `q` doubles as the bound on generated SQL — each
term becomes its own six-column `OR` group.

Both sides of every comparison go through `immutable_unaccent`, so `gregoire` finds
`Grégoire` and `Inès` finds `Ines`. That function is a **deliberately mislabelled** wrapper:
`unaccent()` is STABLE because a superuser can change its dictionary, and an expression index
may only call IMMUTABLE functions, so migration `0006` re-declares it with the dictionary name
pinned. **If the `unaccent` dictionary is ever modified, every index built on it is silently
wrong and must be REINDEXed** — that is the price of the expression index.

Matching the raw column would still return correct rows while quietly dropping to a sequential
scan, because the index is on the _expression_. Verified with the planner: the six-column query
plans as a `BitmapOr` of `Bitmap Index Scan`s with `Index Cond:
(immutable_unaccent(recruiter) ~~* …)`, not a filter.

#### Raw in the URL, trimmed everywhere else

`useOpportunitiesFilters` returns the search twice: `search` is what the URL holds, and
`query` is `search.trim()`. The input binds to `search`, so a space the user just typed stays
visible; everything downstream takes `query`.

That split exists because the trim used to be applied at each call site, and one of them was
missed — the summary's query key was built from the raw value while the server trimmed it, so
`"a"` and `"a "` opened two cache entries for one result and refetched the tab counts for
nothing. Normalising once at the source is what keeps the two queries on the same key.

#### Both tests are load-bearing — do not collapse them

The guard is two nested comparisons: `value !== lastValue` on the outside, `value !== emitted`
on the inside. The outer one looks redundant. It is not, and removing it was tried and
reverted.

`emitted` is written from two places that do not share an ordering: during render, and from
the debouncer callback. With the outer test gone, every render where the prop merely _equals_
a stale `emitted` becomes a candidate for replacing the draft, and React's own re-render after
the callback's `setEmitted` lands in exactly that window. Measured on the real component:
search `thomas`, clear it, immediately type `camille`, and the input visibly snaps back to
`thomas` twice — once at ~360 ms, once at ~780 ms — before settling. Gating on "the prop
actually changed" closes both windows, because a re-render that carries the same prop does
nothing at all.

#### The known limit: a draft that was never emitted

Type `jeanne` over a URL reading `jean` and navigate elsewhere and back to `jean` within the
300 ms: the incoming value equals `lastValue`, the outer test sees no change, and the input
keeps text the URL never received.

It is unfixable from inside the component — an un-emitted draft is by construction absent from
the props, so "the parent is echoing me" and "the parent is reasserting this value" are the
same input. Fixing it needs a signal the props do not carry, such as a navigation id. Left
alone deliberately: the window is 300 ms, the incoming value has to match exactly, and the
pending debounce still fires afterwards, so the URL catches up on its own.

That emitted value is `useState`, not `useRef`, because it takes part in a render decision;
`react-hooks/refs` rejects reading a ref during render, and rightly so — it breaks under
React Compiler and StrictMode.

## 2. The server owns filtering, sorting and paging

[`listOpportunities`](../../src/modules/opportunities/opportunities-server.ts) applies the
tab, the `ILIKE` search, the due filter, the `ORDER BY` and the `LIMIT/OFFSET`, and returns
`{ rows, total, page }`.

TanStack Table therefore runs with `manualFiltering`, `manualSorting` and
`manualPagination` all set, plus `rowCount` for the totals. It is a rendering and
interaction layer only — its own row models would otherwise re-filter the single page it
was given and report totals for that page.

Sortable columns are a **whitelist** (`SORT_COLUMNS`), not a hint: the value reaches an
`ORDER BY`. The URL schema and the server's Zod enum both validate against it.

`isPinned` leads the `ORDER BY` unconditionally, so pinned rows stay on top of whatever
column sort is active.

## 3. The URL asks; the server decides; the table shows what was served

An out-of-range `?page=999` is **kept in the URL**. The server clamps it to the last page
holding rows and reports which page that was, via `OpportunitiesPage.page`. The table's
pagination state is built from that served value, not from the URL.

So the paging controls, the "page X of Y" label and the range label all describe the page
actually on screen, and paging from a clamped page moves relative to it.

Nothing rewrites the URL behind the user. An earlier version clamped in three places at
once — a `redirect()` in the route loader, the SQL `safePage`, and a `Math.min` at render —
with no single authority; that is why the route loader no longer counts rows, and why
`countOpportunities` is gone.

### What this costs

Landing on `?page=999` renders the last page while the URL still says 999. That is the
deliberate trade: the URL records what was requested, the view shows what exists.

### The client derives no pagination arithmetic

`listOpportunities` returns `{ rows, total, page, pageCount }`. `page` is the clamped page
and `pageCount` is the server's own `ceil(total / perPage)` — both feed TanStack Table
directly (`rowCount`, `pageCount`), so the client never recomputes a page count that the
server already decided. An earlier version returned only `total` and let the table derive
the rest, which duplicated the clamping rule on both sides.

### Why two queries and not one

The count runs alongside the page query in a `Promise.all`, on the optimistic assumption
that `?page=` is in range; only an out-of-range page pays for a second round trip.

Folding both into one query with `count(*) over()` was measured and rejected: the window
function forces Postgres to materialise every matching row before the `LIMIT`, which costs
the `top-N heapsort` and turns a bounded sort into a full sort of the filtered set.

## Why the loader carries no `loaderDeps`

The route loader fetches only what the table's own queries do not: the daily-rate
reference, and a warm React Query cache for the stages.

It declares no `loaderDeps`, so it never re-runs on a search-param change. Paging,
sorting and filtering are React Query's concern — a `loaderDeps` covering them would make
every paging click wait on the loader's server round-trips before React could re-render.

### The parent `_authed` loader needs no `staleTime`

The `_authed` loader calls `getSidebarState()`, a `createServerFn` reading the
`sidebar_state` cookie, and it carried `staleTime: Infinity` to stop that round-trip
repeating on every keystroke. It was removed after measuring: **the round-trip was not
happening.**

`staleTime` gates only the loader, never `beforeLoad`, and even there it is not the whole
test. `load-matches.ts` reloads a match on `age >= staleAge` **and** one of three triggers —
`forceStaleReload`, `match.cause === 'enter'`, or a changed match id. A search-param
navigation is `cause: 'stay'` on a stable id, so no trigger fires and the age is never
consulted. Declaring no `loaderDeps` is what already keeps the loader still.

Measured in the browser: typing six characters issues two requests
(`getOpportunitiesSummary`, `getOpportunities`) with and without the option, and
`getSidebarState` appears in neither — nor on paging, sorting, or a tab switch. A full page
load resolves everything in SSR and issues no client server-fn call at all. `getUserFromServer` used to
show up in this list; the identity is now verified in the browser instead — see
[`auth.md`](auth.md).

If a `loaderDeps` is ever added here, or the loader starts reading something that changes,
revisit this — the option would become load-bearing then.

`ssr: 'data-only'` runs that loader on the server without rendering the dashboard's HTML.
The page is behind auth (no SEO value), and the due filter depends on the **browser's**
date — rendering it server-side would compute rows against the server's timezone and
hydrate into a mismatch. See [`kpis.md`](kpis.md) for why "today" always travels from the
client.

## A narrow screen gets cards, not a sideways scroll

The skeleton has to follow the same layout, and that means more than reusing the card template.
It takes the **column ids in order** and the same `cardCellClassName` the table uses: without the
placement its cells drop into the card grid in source order, landing three-across in slots sized
for a badge and a menu button. It also takes the silent column by **id** rather than a boolean —
the actions column is last, and a flag could only ever put it first, which shifted every column
by one on desktop.

The fixed `h-13` on a cell is the tracker's row height, and it only applies to the flat bar,
which is shorter than any real cell. A card stacks three lines, so below the breakpoint that
height lifts (`h-auto @3xl:h-13`) or the placeholder stands half again as tall as the rows it
stands in for.

A table that draws its own placeholder gets no fixed height: the row takes its height from the
placeholder, which is therefore sized like the content it replaces. The contacts list puts each
bar in a line box of the text it stands for (`h-lh` at `text-sm`, then at `text-xs`), so a loading
row is 65px like a loaded one — the fixed 52px made the list jump by 13px a row as it loaded.

A placeholder for a string the page already knows — a title, a label, a chip — is that string,
transparent on the skeleton tone: `SkeletonText` (`src/components/skeleton-text.tsx`). Its width
and line breaks are the loaded ones in every locale, where a hardcoded width only fits French.

One token trap: the header bars cannot use the `Skeleton` default (`bg-muted`) or `bg-sidebar`.
The header row is `bg-secondary`, and in dark `muted`, `secondary` and `sidebar` all resolve to
the same lightness — the bars disappear entirely. `bg-border` sits just off `secondary` in both
themes, darker in light and lighter in dark.

**A cell's placeholder is the table's business, not the skeleton's.** One flat bar is a poor
stand-in for a cell that loads a medallion over two lines of text, so `cellPlaceholder` lets a
table draw its own: the contacts list mirrors its design artboard — a 36px circle, then a 10px
bar over a 9px one, with widths that differ per column so the block reads as a list of people
rather than a grid. Tables that pass nothing keep the flat bar.

The same dark-mode trap bites twice. The two bar weights are `muted` and `border-soft`, which
differ in light (0.973 / 0.959) but resolve to _exactly_ the same value in dark (both 0.258),
flattening the pair. Dark therefore borrows `border` (0.287) for the lighter line.

`DataTable` is built on CSS grid rather than real table layout — `display: grid` on the `<table>`,
the column template on each `<tr>`. That is what makes a card layout a **different grid template
on the same markup**: pass `cardTemplate` and each row lays its cells out as blocks instead of
columns, below a `@3xl` container query. There is no second render path, so the rows keep one DOM
tree, one set of ARIA roles and one keyboard behaviour in both layouts.

The breakpoint is a **container** query, not a viewport one: the sidebar collapses independently,
so what matters is the width the table actually gets, not the window's.

Three details the layout depends on:

- **Both templates are written out in full by the caller.** Tailwind only generates classes it can
  see literally in the source, so a template composed at runtime (`'@3xl:' + gridTemplate`) emits
  no CSS at all and fails silently.
- **The header is hidden below the breakpoint**, because a column header names a column and a card
  has none. It hides a label, never a control — sorting lives in the toolbar.
- **A cell whose meaning came from its header has to carry it itself.** The opportunity count
  reads as a bare `1` under an "Opp." header and as "1 opportunité" on a card; the two variants
  swap at the same breakpoint.

`min-w-200` is what forced the sideways scroll, and it stays the default: a table that passes no
`cardTemplate` — the tracker — is untouched by any of this.

## Related

- Generic table plumbing and markup: [`table-mechanism.md`](table-mechanism.md)
- Follow-up and archive rules: [`data-model.md`](data-model.md)
- Aggregate cards: [`kpis.md`](kpis.md)
