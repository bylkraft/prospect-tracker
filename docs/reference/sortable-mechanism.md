# The sortable mechanism

`src/shared/sortable/` holds everything about reordering a list that carries **no domain
knowledge**: the drag wiring, the row shell and its grip, the reorder menu entries, the screen
reader announcer and the list-moving helpers. A domain module supplies its items, its list id and
its commit handler — nothing else.

It lives in `src/shared/` rather than `src/modules/`, alongside `table`: a module owns a domain,
and nothing here knows what a stage or a job type is. The alternative was five files scattered
across `src/hooks/`, `src/components/ui/` and `src/lib/utils.ts` that only ever serve this one
concern.

## What lives where

| Concern                              | Sortable module        | Domain module           |
| ------------------------------------ | ---------------------- | ----------------------- |
| Drag wiring, drop targets, indicator | `useSortableList/Item` | —                       |
| Row shell, grip, menu entries        | `components/`          | —                       |
| Move helpers, `nextPosition`         | `sortable-utils.ts`    | —                       |
| Screen reader announcement           | `useReorderAnnouncer`  | —                       |
| The list id, the items, the commit   | —                      | `STAGES_LIST_ID`, cards |

Its messages carry a `sortable_` prefix for the same reason: "Move up" belongs to the mechanism,
not to the customization page.

What stayed **outside** it is what genuinely serves anyone: `AnimatedList` animates any list, and
`LiveRegion` announces anything. Each list's `LIST_ID` stays with its own domain.

`sortable-server.ts` holds the one server-side piece, `writePositions`, and is imported only from
`-server.ts` files — the bundler boundary in CLAUDE.md applies to it like any other. What stayed in
`src/lib/` is `optimisticList`/`rollbackList`: they are TanStack Query plumbing that every mutation
uses, reorder included but not specially.

Every drag is namespaced by a `listId`, so a job type cannot be dropped into the levels list.

## Dragging is an addition, never a replacement

A grip on each row is the drag source, and the row menu carries the same moves as entries:
**move to top, up, down, move to bottom**. Both exist on purpose, and Atlassian's
[accessibility guidelines](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/accessibility-guidelines)
for the library are the reason:

- _"Provide other ways for people using assistive technologies to achieve the same outcomes as
  pointer based drag and drop operations."_ — the menu is that path. Dragging alone would leave
  keyboard and screen-reader users with no way to reorder at all.
- _"Having a More button does not remove the need for a drag handle icon."_ — the grip was briefly
  dropped once the menu carried the moves. Nothing then announced that a row could be dragged, and
  on touch there is no hover to reveal it. It is back, and always visible: dragging is a primary
  action here, not a secondary one.

The grip is a real `button` (24×24, the guidelines' minimum touch target) and opens each row's tab
order. Once it became the only way to start a drag it had to be reachable without a pointer.
Activating it does nothing on its own — the menu's reorder entries are the keyboard path — so its
label says so. The guidelines' own escape hatch, converting the grip into a menu trigger, needs
the row to have _no_ More button and movement to be its only action; ours has both.

Pragmatic's own `dragHandle` option enforces this: it hit-tests the cursor against the handle on
`dragstart`. An earlier version made the whole row draggable and tried to exclude the controls
with `elementFromPoint`, which never worked — the hit-test returns whichever wrapper sits on top,
a `div` for `CommittedInput` rather than the `input` itself, so every drag was allowed.

## Why Pragmatic drag and drop

Picked over `@dnd-kit` for the kanban view coming later: its stable `@dnd-kit/core` v6 has not
published since December 2024, and the maintained `@dnd-kit/react` is still `0.x`. Pragmatic is
framework-agnostic (~4.7 kB core, no React peer dependency on the packages used here) and attaches
behaviour to existing elements instead of cloning or transforming them, which matters for rows
already built out of `CommittedInput`, `StageColorPicker` and a dropdown menu.

Its `-react-accessibility` package was declined: it pulls Emotion, Atlassian's icons and their
token system into a Base UI + Tailwind app. The grip is ~15 lines of our own instead.

## The hit area is wider than the row

The drop target declares `getDropEffect: () => 'move'` — without it the browser assumes `copy` and
the OS paints a green `+` badge beside the cursor, which is both wrong (a reorder moves a row) and
distracting.

Each row extends its hit area by an inert `::after` across the 10px the list leaves between rows: a
target that stops at the visible edge leaves a dead strip the cursor crosses constantly, blinking
that badge on and off. The last row omits the bridge, or it would reach over the add button and
swallow its clicks.

Those bridges all hang downward, which left the top of the list uncovered: every other gap belongs
to the row above it, but nothing hangs over the first row, so a row dragged to the very top found
no drop target and the drop did nothing — while dragging to the bottom worked. The first row
carries a mirrored `::before` for that gap. It cannot swallow anything the way a trailing bridge
would: above the first row sits only the card's own padding.

That fix needed a second one to take effect. `AnimatedListItem` clipped every row with a permanent
`overflow: hidden`, whose box starts exactly on the row's top edge — so the new `::before` was
painted and then clipped away, and the gap still hit-tested to nothing. The clip only exists to
keep a row's shadow from spilling past its collapsing height, which matters _while_ the height
animates and never at rest, so it is now bound to that: `hidden` during the animation, `visible`
once it settles. The flag starts `false` rather than `true` — under `AnimatePresence
initial={false}` the rows already on screen run no enter animation, so a `true` start would have
nothing to complete and would stay clipped forever, which is exactly the bug it was meant to fix.

## The preview promises only what the interaction delivers

The drag preview is a small chip naming the row, offset beside the cursor
(`setCustomNativeDragPreview` + `pointerOutsideOfPreview`), not the browser's default full-width
ghost of the row. A row only ever moves up or down inside its own list; a full card floating free
under the pointer suggests it could be taken somewhere else — another column, another card — which
is a promise this interface cannot keep. Atlassian's own list example does the same.

For the same reason the drop indicator is hidden on the two edges that flank the dragged row: both
would return it to where it started, and drawing a line there advertises a move that will not
happen.

## Every move is announced

A reorder moves a row without changing focus and without adding any text to the page, so nothing
reaches a screen reader on its own — the menu closes and the list silently differs. Every commit
therefore announces its result through a polite live region (`useReorderAnnouncer`), covering the
menu entries and drops alike since both go through the same commit.

The caller passes the moved row's id; the announcer never deduces it. Comparing the two orders
cannot tell which row the user moved — swapping two neighbours shifts both by exactly one, and an
earlier version that guessed by largest index shift announced the bystander instead. The region
clears a second later, because assistive tech only reacts to a change and a repeated move would
otherwise announce nothing.

A list of one renders no reorder entries at all rather than four disabled ones: with nowhere to
move, the whole group is noise.

## A row registers against its handle, so the handle is state

`useSortableItem` bails out when the grip is missing (`if (!element || !handle) return`). A list
of one has nowhere to move, so the coordinate lists render no grip until a second row arrives —
and that grip mounts after the row's effect has already run. With the handle in a ref, the effect
would never re-run: the first row would stay unregistered, neither draggable nor a drop target,
and dragging row two onto it would silently do nothing.

So the handle is held in state (`handleRef` is its setter, used as a callback ref) and the effect
depends on it: the grip mounting is what registers the row. The tell when this breaks is
`draggable` in the DOM — Pragmatic sets `draggable="true"` on every element it registers.

## Identity can be positional

The settings lists reorder rows that carry a database id. A form's rows carry none — a coordinate
is a value and a label, and two blank ones are indistinguishable. Deriving an id from the value
would change it on every keystroke, mid-drag, and collide as soon as two rows are empty.

`rowIds` (`sortable-row-ids.ts`) hands out `prefix-index` instead: the id names the **slot**, and
the values move underneath a fixed set of ids. Two consequences follow, both wanted. The ids never
change, so `useSortableItem` never re-registers a list on a move. And the announcer cannot follow
an id to find what moved — it reads the value at the destination index instead, which is why
`EntryListField` announces by hand rather than through `useReorderAnnouncer`.

The prefix is the form field's own name, because both coordinate lists live in the same sheet and
a shared list id would let a phone be dropped into the emails list.

## The index is read at drag time, not captured

`useSortableItem` takes an `index`, but depends only on `[listId, id]`. A reorder shifts every
row's index, so depending on it would tear down and re-register the whole list's drag listeners on
every move — 16 rows re-subscribing to move one. The index is read through a ref at drag time
instead, which is when Pragmatic actually calls `getInitialData` and `getData`.

## Positions are written in one statement

`writePositions` (`sortable-server.ts`) settles every position with a single
`update … set position = (case when id = … then … end)`. The earlier version looped one `UPDATE`
per row inside a transaction, and `Promise.all` did not parallelise it: a transaction holds one
connection, so the statements ran serially and the cost grew with the list — ~680 ms for 16 rows
against ~180 ms now, and flat rather than linear.

Two traps sit in that rewrite, both silent:

- **The positions are bound parameters**, and Postgres types them as `text` by default. Without an
  explicit `::integer` the whole `CASE` resolves to text and the integer column rejects the write.
  The query fails server-side, the optimistic update rolls back, and the list simply snaps back
  with no error on screen — it looks like nothing happened rather than like a bug.
- **A generic `PgTable` parameter loses the column mapping.** Typing the helper against `PgTable`
  and setting `{ [column.name]: … }` compiles and updates nothing. The union of the three concrete
  tables keeps `position` a real typed column, so the compiler catches a mistake instead of the
  database swallowing it.

There is no unique constraint on `(user_id, position)` — `stages_user_position_idx` is a plain
index — so the intermediate states inside a single statement raise no conflict.
