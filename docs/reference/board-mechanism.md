# The board mechanism

`src/shared/board/` holds everything about a **column board** that carries no domain knowledge:
the cross-column drag wiring, the edge scrolling, the motion of a move, the column and card
shells, the empty drop zone and the move announcer. A domain module supplies its columns, its cards and its commit handler — nothing else.

It sits beside `sortable/` and `table/` for the same reason they do: nothing inside knows what a
stage or an opportunity is. The test from CLAUDE.md holds — if it needed a domain type to compile,
it would be a module.

## Why not reuse `sortable/`

`sortable/` reorders **one vertical list**, and every part of it encodes that: `reorderWithEdge`,
the `closestEdge` hitbox, the top/bottom drop indicator, an `index` per item, and an announcer that
says "moved to position 3 of 12".

A board move is a different gesture. It crosses **between** lists, has no index, and — because
order inside a column is not persisted (see below) — no edge and no indicator. Reusing the sortable
hook would have meant threading a second axis through every one of those, to end up with two
behaviours sharing a name and nothing else.

What the two genuinely share is reused rather than copied: `useAnnounce` and `LiveRegion` back the
move announcement. Pragmatic drag and drop is the same library, chosen originally with this view
in mind — see [the sortable doc](sortable-mechanism.md) for why it beat `@dnd-kit`.

## Order within a column is not meaningful

A card's position inside its column is not persisted, and the board is explicit about that:

- There is no drop indicator between cards, and no edge detection. A drop anywhere in a column
  means "this column", not "here".
- A drop back into a card's own column resolves to `null` — a write that would show nothing.
- Cards are ordered pinned-first then most recently updated, server-side. That is the same lead
  sort as the list, so a pinned card sits at the top of its column exactly as it sits at the top
  of the table.

Anything else would promise an ordering the next reload would not keep.

## The whole card is the drag source

Unlike the sortable rows, a card carries **no grip**. Atlassian's own design guidelines put it this
way: _"if an entity is draggable, make the whole entity draggable. If the entity has other
interactive parts like buttons or dropdowns, make only the drag handle icon the draggable part."_

The sortable rows take the second half of that sentence, because a stage row is built out of
`CommittedInput`, `StageColorPicker` and a menu — there is barely any row left to grab, and
`elementFromPoint` cannot hit-test around them reliably.

A card is the opposite: it is mostly text, with two small controls in one corner. So it takes the
first half. `canDrag` rejects a drag whose starting point lands on a control, which keeps pressing
the pin or opening the menu from lifting the card. The guard ignores the card element itself, so a
board whose card is a `role="button"` still drags from anywhere inside it.

The cost of dropping the grip is that nothing on the card announces it can be dragged, so the card
says it another way: a `grab` cursor, and a hover state that eases its border towards the accent
and lifts it by 2px with a shadow. Only 2px: the column scroller clips, and its top padding is
4px, so a taller lift would crop the first card.

## Dragging is still an addition, never a replacement

The same rule as the sortable lists, for the same reason: every card carries a menu whose entries
move it to any other column. A mouse-only board would regress the keyboard path that Customize
already ships.

**The card is not a button; its title is.** A `role="button"` makes every descendant
presentational, so the pin and the move menu inside it would be flattened or skipped by a screen
reader — and that menu is the only non-drag way to change a stage. So the card container takes the
pointer click only, and its title is a real `Button` that the keyboard reaches and that opens the
panel on Enter or Space; the pin and the menu sit beside it as siblings. The title is
`pointer-events-none`: a press on it falls through to the card, so it still starts a drag and still
opens the panel, while keyboard focus is unaffected. The card draws the focus ring with
`has-[…:focus-visible]`, so the ring still outlines the whole card. `useBoardCard` hands out the `focusRef`
the title attaches to.

The menu lists every active stage except the card's own, which is not a destination. A card in the
only active stage therefore renders no menu at all, rather than an empty one.

A menu move **keeps the focus on the card**. Columns are keyed by stage, so the moved card unmounts
from its old column and mounts in the new one, taking the focused menu trigger with it — the focus
would drop to `<body>` and a keyboard user would restart from the top of the page. Before moving,
the menu item calls `beforeMenuMove`, which records the card id per board; the card claims it
when it mounts again and focuses its title. The claim expires after a second, so a card the move
filters off the board (a due-only view, say) cannot steal the focus whenever it next appears.

Every move — dragged or chosen from the menu — goes through one `commitMove`, so the screen-reader
announcement covers both paths and cannot drift between them.

## The drop resolution is a pure function

`resolveDrop` is exported and unit-tested rather than living inside the `onDrop` closure, because
it is the only judgement in the drag path and a unit test cannot reach it otherwise: Pragmatic
drives its drags through native drag events, which neither synthetic DOM events nor a
hand-dispatched `DragEvent` can enter. Only a browser-level drag can, which is how the wiring and
the motion were checked; the decision itself — which column a drop resolves to, and when a drop is
a no-op — is covered by tests.

`resolveDrop` reads the innermost drop target first, so a card dropped **onto another card** lands
in that card's column rather than missing the column behind it.

## Every drag is namespaced

Like the sortable lists, each drag carries a `boardId`, and both the source and the target are
checked against it. A payload from another board — or a malformed one — resolves to `null` instead
of moving the wrong card.

## The board scrolls under a drag

A pipeline wider than the screen, or a column taller than it, would otherwise leave a card with
nowhere to go: native drag and drop does not scroll a container for you. The row and every column
scroller register with `@atlaskit/pragmatic-drag-and-drop-auto-scroll`, the library's own package,
rather than a hand-rolled `requestAnimationFrame` loop that would need its own hitboxes, speed curve
and time dampening.

- The row scrolls **horizontally only** and each column **vertically only**, so a drag near the
  bottom of a column never drifts the board sideways.
- Only this board's cards trigger it (`canScroll` checks the `boardId`), like every other drop
  decision.
- The row is held in state rather than a ref: it mounts only once the board has cards, after the
  hook first runs, and a ref would never re-subscribe.

## A move is animated, not redrawn

Once picked up, the card follows the pointer **as itself** — a clone of the card element, at its
own width, slightly tilted, held at the point where it was grabbed. A label-only chip reads as a
different object from the one that left the column. The clone is a native drag image, so the tilt
is fixed; a tilt that follows the pointer would need a React-rendered preview instead.

A move remounts the card in its new column, as the focus paragraph above explains, and that is
also what lets it **animate its landing**: the card in the new column is a new element, with no
memory of being dropped. A drop records where the preview was released (the
pointer minus where the card was grabbed), and the card that claims it starts there — tilted, lifted
— and glides into its slot, then settles with a small overshoot (`board-motion.ts`). It is a FLIP
animation through the Web Animations API, so nothing re-renders while it plays. A menu move has no
release point and rises from just below its slot instead.

A slot can be out of view: a move lands at the head of its pin group, and a long column may be
scrolled down. The glide would then end behind the column's clipping edge. So the card is first held
where it was released while the column scrolls its slot into view, and only then glides, always
ending on screen. The hold is measured before the card is moved, and the title is focused with
`preventScroll`, so neither the measurement nor the focus jumps the column ahead of the animation.

The neighbours move too: every card remembers its `offsetTop` across renders and glides from the
old value when a move elsewhere in the column changes it, so cards close the gap a card left and
open the one it lands in instead of jumping. `offsetTop` is unaffected by scrolling, so a scrolled
column never reads as a move. Picking a card up is the mirror image of landing: the source fades
and shrinks slightly while its preview leaves. All of it is skipped under reduced motion.

While a card is in the air, the others hold still: cards do not slide apart to make room for it,
unlike list-based boards. That gap would mark _a position_, and position inside a column is not
persisted (see above). They move once the card has landed, to close and open real gaps.

The timings and curves live in `board-motion.ts`, next to the one lifted look — tilt and shadow —
that the preview and the landing card share, so the handover between them cannot drift.
