# The kanban view

One page, two view modes. The KPIs, the search, the Active/Archived tabs and the "due for
follow-up" filter are identical in both and keep applying; only the centre area changes shape.

The mechanism behind the board — drag wiring, columns, cards, the announcer — is documented in
[the board mechanism](board-mechanism.md). This page covers what is specific to opportunities.

## The view lives in the URL

`view=kanban` joins `tab`, `q`, `due`, `sort` and `page` in the query string, under the same rules
as the rest (see [the server-side table](server-side-table.md)): `.catch()` rather than `.default()`
so a hand-edited URL falls back instead of throwing, and `stripSearchParams` keeps the default view
out of the URL entirely — the list view still reads `/app/tracker`.

So a board survives a reload and can be shared as a link, search included. Returning through the
sidebar, which links to a bare `/app/tracker`, reopens the last view chosen — see
[UI preferences](ui-preferences.md).

## The board is a different query, not the table's rows

A board is read whole, so it takes no page. `getBoard` shares `buildWhere` and `isDueExpression`
with the table — the filters are the same filters — and drops the sort and the page:

- **Ordered pinned-first, then most recently updated.** Column order is not persisted, so recency
  stands in for it, and pinning stays the lead sort it is in the list.
- **Capped at `BOARD_ROW_LIMIT`.** Unbounded is a liability on a page that renders every row at
  once; past the cap the board says so in a line above the columns rather than silently showing
  part of the pipeline.
- **One flat list, grouped on the client.** A query per column would multiply round trips by the
  pipeline length and still need a client-side merge.

Only the view on screen is prefetched. Loading both would be a second full query for rows nobody
is looking at.

## What the board deliberately drops

- **The stage filter is hidden.** Filtering by stage removes columns, which contradicts an
  at-a-glance read of the pipeline.
- **Pagination disappears.** A board is read whole; if volume becomes a problem it is a separate
  topic, and the row cap is the stopgap.
- **Column settings disappear** from the Display menu — there are no table columns to hide, so the
  section would name nothing on screen.

Search stays, because it describes _what_ you look at, not _how_ it is displayed. The KPIs stay,
because removing them would make the board feel like a degraded page.

## Every active stage is a column

Including the empty ones: a board that hides an empty column stops describing the pipeline, and
the empty column is exactly the signal worth seeing. Each keeps its stage colour, its count, and an
explicit drop area when it holds nothing.

Archived stages get no column while they are empty — they are stages the user put away. One that
still holds cards gets its column back, in pipeline order: that only happens in the archived
tab, which counts those rows, and a board showing fewer cards than its tab announces reads as data
loss. Such a card can be moved out like any other, but nothing moves in: the menu never offers an
archived stage, and neither the column nor the cards in it accept a drop.

## The card carries the row's essentials

Need, ESN, end client, day rate with the same green/red colouring against the reference rate, last
contact, and the pin. Two details differ from the table on purpose:

- **The date is relative** ("il y a 3 j"). A card has no room for a full date, and staleness is
  what the board is read for — `12/08/2026` needs arithmetic to say the same thing. The list keeps
  the exact date.
- **Empty fields are omitted rather than dashed.** A card is short; two `—` placeholders cost the
  same height as two real lines. When the need is missing, the primary contact becomes the title
  rather than sitting under a bare dash.

Clicking a card opens **the same sheet** as the list. There is no second read-only interface: an
opportunity is viewed and edited in one place, whatever view you came from.

## Moves and pins are optimistic, and revert one card at a time

Dragging a card, picking a stage from its menu and pinning it all write through the ordinary
`updateOpportunity`, behind one board hook (`use-board-update.ts`). The card lands before the
server answers — the whole point of dragging over opening the panel:

- **Where the refetch will put it.** The server bumps `updatedAt` on every write, so the card is
  placed at the head of its pin group straight away instead of jumping there when the list lands.
- **Due state follows an outcome stage.** A card moved to Refusé or Ghosté stops being due at once
  (`isTerminalStage` mirrors the SQL `isTerminal`), and leaves a due-only board. Every other change
  to `isDue` waits for the refetch: it depends on the stage's reminder delay, which only SQL
  computes.
- **A card moved out of an archived stage leaves the archived tab** at once, unless the row is
  archived itself. Moves only ever target active stages, so that is the whole rule.
- **A failure reverts that card only**, with an error toast. Restoring a snapshot of the whole
  board would also undo whatever was moved since. The revert targets the board the write was made
  on, carried in the mutation context: TanStack Query hands a pending mutation the options of the
  latest render, so a filter change before the answer would otherwise revert into another board's
  cache.
- **One refetch, after the last write.** The writes share a mutation key, and only the last one to
  settle invalidates. A refetch fired between two moves would read the second before it commits
  and snap that card back.

The board is never dimmed for these refetches — they confirm what is already drawn. It dims only
while a filter change still shows the previous results.

The invalidation targets the whole opportunities key rather than the board's own: a stage change
can move a row between the active and archived tabs and shifts the sidebar's stage counts.

## Field visibility

The Display menu also carries which fields are visible, stored as `hidden=esn,location`.

**One vocabulary for both views.** `hidden=esn` means the same thing whichever view is on screen,
so switching between them keeps the choice instead of resetting it. Each view then declares which
of those fields it actually draws, and the menu offers only those — the card carries no location,
so hiding it there would toggle nothing.

It stores the **hidden** columns rather than the visible ones, so an untouched setting writes
nothing to the URL and a column added later appears without a migration. The value is normalised in
the schema the way `sort` is — an unknown column never survives into the URL — and serialised in a
canonical order, so two ways of hiding the same pair produce one link.

The contact and the stage cannot be hidden in either view: one names the row, the other is what
the view is about.

Hiding a column drops its **grid track** as well as its cells. The track list is therefore built
from the visible columns and passed as a CSS variable, not as an interpolated `grid-cols-[…]`
class — Tailwind extracts class names from source text, so a class assembled at runtime generates
no CSS at all. The header, the rows and the skeleton all read the same variable, which is what
keeps them aligned.
