# Contacts

A contact is a person, reusable across opportunities. The value is not the isolated mission,
it is the relationship history: the same ESN account manager pitches three missions over two
years, changes company, calls again a year later.

The scenario the feature exists for: **an unknown number calls, and the number is typed into
the search box while the person talks**. Everything below is shaped by that.

## The model

Three tables, [`src/db/schema.ts`](../../src/db/schema.ts) as always the source of truth:

- `contacts` — identity, reachability, relationship type, notes.
- `opportunity_contacts` — the many-to-many link, **ordered**.
- `opportunities` — no longer carries a `recruiter` text column.

### Reachability is stored as arrays, not a child table

`emails jsonb` and `phones jsonb`, each an array of `{ value, label }`. A child table would be
more normalised and it was rejected anyway: reachability is **read whole and written whole**,
never queried one entry at a time. A join on every list query and a nested editor in the form buy
nothing at this size.

The caps (`MAX_EMAILS`, `MAX_PHONES`) live in the schema, not the database — five of each is a
form ergonomics decision, not an invariant worth a constraint. The **shape** is a constraint
though: `contacts_phones_shape` and `contacts_emails_shape` reject anything that is not an array
of objects with a non-empty string `value` and a `label` drawn from the closed vocabulary or
`null`.

### Order carries the primary, in all three lists

Entry zero is the one we call, so the coordinate rows are full width and reorderable rather than
paired in two columns — position is the only thing that says "this is the number to try first",
and it has to be changeable without retyping. The same rule runs through the linked contacts on an
opportunity, where position 0 is the contact who pitched.

The coordinate lists use `src/shared/sortable/`. Their rows have no id of their own, so their
identity is positional — see the sortable doc for what that costs. The grip only appears from two
rows on: a single number has nowhere to move.

### The link is ordered, and position 0 means something

`opportunity_contacts.position` is the array index of the contact in the opportunity's own
list. **Position 0 is the contact who pitched**, and it is what the tracker's Contact column
shows and sorts on. An opportunity typically carries the account manager who brought it plus
the engineer who ran the interview; without an order, "who pitched this" is unrecoverable and
the column would need an arbitrary alphabetical tiebreak.

Writing the list is one operation: saving the opportunity hands its `contactIds` to
`writeContactLinks`, which deletes every link and reinserts the array in the same transaction.
`undefined` leaves the links alone, so a partial update such as a pin toggle never unlinks anyone.
The ids are unique (`linkedContactIdsSchema`) and capped at `MAX_LINKED_CONTACTS`. Linking, unlinking and making a contact primary are therefore the same code path, and
there is no partial state where two contacts claim position 0.

## Linking from an opportunity

The section is drawn in Claude Design (`ProspectTracker Opportunite Contacts.dc.html`, tour 3).

- **One card.** The linked people, then a search bar that closes the card, with "Créer" trailing
  it. The link and create buttons used to float under the card, disconnected from what they act on.
- **Something to pick before typing.** An empty query returns the three most recently linked
  contacts (eight results once something is typed — the server picks the limit from the query) (then the most recently added, so a fresh account still gets suggestions). Linked
  contacts are excluded **by the server**, or they would eat into those three rows.
- **An Autocomplete, not a Combobox.** Every row is an action — link this person, or create one
  — and nothing stays selected, which is the case Base UI's docs give to `Autocomplete` (the
  command palette). It shares every part but `Root` with `Combobox`, so the shadcn combobox
  styles the bar, the popup and the list. The rows use Base UI's item directly: the shadcn item
  recolours every descendant of the highlighted row, which would paint the muted line and the
  marked term the same colour. Searching and "no contact found" sit in `Autocomplete.Status`, a
  live region, since Base UI drops an empty group.
- **Enter acts on what the screen shows.** `autoHighlight="always"` highlights the first row as
  soon as the list opens and `keepHighlight` keeps one when the pointer leaves, so Enter is
  Base UI's own: it clicks the highlighted row. "Créer…" is a row of the list, not a footer
  button, so the arrows reach it and it is what Enter takes when nobody matches. The list is
  therefore never without a highlight while open — Base UI lets an unconsumed Enter submit the
  owning form, and here that form is the whole opportunity.
- **Rows from the previous query stay only while they still match.** Each keystroke is a new
  query; the previous answer is kept so the list does not blink, but a row survives only while
  its name still contains the typed term (folded the way the server folds it). Enter can then
  never link someone the new term rules out.
- **Creating starts from what was typed.** "Créer le contact « cami »" opens the contact sheet
  with the term split by `splitFullName`: on the last space, like migration 0008, but a single
  word becomes a first name — people search for "Marie", not "Dupont" — or, for a term that reads as a number (`isPhoneTerm`, the rule the search
  uses), as its phone. The company comes
  from the opportunity: its ESN, or its end client when the mission came direct. The note
  saying so shows only when a company was actually carried over. The draft is the form's
  baseline, so closing an untouched sheet asks for no confirmation — the user has not started
  filling it in — while the save button, which otherwise waits for a change, is live as soon as
  the draft holds something.
- **The opportunity sheet owns the contact sheet it opens.** It is rendered inside the
  opportunity sheet's root, so Base UI treats it as a nested dialog: one backdrop rather than two
  stacked, and Escape or "Annuler" closes it alone, back onto the opportunity. Saving links the new
  contact directly, with no channel back through the provider. The contacts page and the header's
  "Nouveau contact" have their own instances.
- **No drag.** Only the first place means anything, so the order is not a list to arrange: a row's
  menu offers "Définir comme principal", which moves it to the top. The menu is always visible —
  it is the only path to that action, and hover does not exist on a touch screen.
- **"Ouvrir la fiche" opens a new tab.** The sheet may hold unsaved edits that navigating away
  would drop.
- **The primary rule is said once.** In the empty state, where it explains what the first link
  will do; afterwards it waits behind the "Principal" badge instead of a permanent sentence. A
  popover opening on hover, not a tooltip: Base UI's tooltips reach neither touch nor screen
  readers, and its docs send explanations like this one to `Popover` with `openOnHover` — a
  focusable button that also opens on tap and on Enter.
- **The row shows the number to call** (company · first phone, or "aucun numéro"), which is why
  `LinkedContact` carries `phone`.

### Two check constraints, both mirrored in Zod

- `contacts_identified` — at least one of first name, last name, company. A contact with none
  of the three cannot be addressed or found, and the row would be dead weight.
- `contacts_relationship_token` — the relationship is a closed set, not free text. That is the
  whole point of the field: it separates a lead source from a decision maker, and the list
  filters on it.

Both are enforced again in `contacts-schema.ts` so the user gets a field error rather than a 500. The Zod side is the mirror, never the authority — Drizzle bypasses RLS, so the database
has to hold the line on its own.

`updateContactSchema` cannot simply be `.partial()`: Zod refuses `.partial()` on a schema
carrying a refinement. The identity rule is therefore a standalone predicate, applied to the
create schema whole, and to the patch only when it actually touches one of the three names —
a patch setting `city` must not be rejected for saying nothing about the name.

**The identity rule cannot live on the patch schema.** A patch carries only what changed, so
`{ firstName: null }` says nothing about the stored last name or company — rejecting it there
would refuse a legitimate edit. `updateContactSchema` therefore carries no identity refinement;
`isIdentified` is exported and the server applies it to the **merged** row, inside the same
transaction that reads it, mirroring the `contacts_identified` check constraint that would
otherwise surface as a 500.

`.partial()` is also not enough on its own: a key carrying `.default()` still materialises that
default when omitted, so `{ id }` alone parsed to `{ emails: [], phones: [], relationship:
'other' }` and `updateContact` handed that straight to the `UPDATE` — a patch touching only the
city wiped every stored email and phone. The patch schema therefore re-declares those three keys
as plain optionals, while create keeps its defaults, where they are correct because the row is
new.

### Sorting and searching follow the displayed identity

A contact with no name is displayed under its company (`contactDisplayName`). The SQL has to
agree, or those rows sort under an empty key and cannot be found: the contacts list sorts on
`coalesce(nullif(btrim(first || ' ' || last), ''), company)`, the tracker's Contact column reads
the same expression, and its search matches the company too. Three places, one rule — change one
and the others must follow.

### The link table's ordering invariants

`position = 0` means "the contact who pitched", so it must identify exactly one row: migration
`0009` adds a unique index on `(opportunity_id, position)` and a `position >= 0` check. The
payload is guarded on the same axis — `contactIds` refuses a repeated id, which would otherwise
collide on the join table's primary key and surface as a 500 rather than a field error. The
server rewrites the whole list (delete then insert, one transaction), so the unique index never
trips on a reorder.

## The form follows the design, and the design has reasons

The section is drawn in Claude Design (`ProspectTracker Contacts.dc.html`, tour 2). What the code
mirrors, and why each one matters:

- **One CTA per page, in the app header.** The tracker offers "Nouvelle opportunité" there; the
  contacts page offers "Nouveau contact" and nothing else. Two create buttons on one screen made
  the page ask which object you meant to create.
- **The label select sits on `bg-card`, not the field's own ground.** On `bg-secondary` — the same
  token as the field around it — it read as static text rather than a control. Dark mode needs the
  override spelled out (`dark:bg-card`), or the trigger's own `dark:bg-input/30` sinks it back in.
- **Creation asks for five fields**, then folds emails, "poste, ville, LinkedIn" and notes behind
  collapsed rows. A contact captured mid-call is a name and a number; eight empty fields make that
  feel like filing. Editing expands everything, because by then the point is to complete the record.
- **Deleting lives at the far left of the sheet footer**, apart from Annuler/Enregistrer, so it is
  never hit while reaching for Save.
- **Errors name the problem on the offending row.** An invalid address says the domain is missing,
  under that line — not "invalid email" under a list of five. The identity rule flags both name
  fields, because the rule is about the pair.
- **The coordinate row stacks on a narrow sheet**, value above label, since side by side the value
  gets squeezed to a few characters.

The chips carry counts computed against the search but **not** against the relationship filter: the
number says what switching to that chip would give, rather than repeating the current selection.

### The coordinate row rings for its value, not for its label

The row is one bordered container holding two controls: the value input and the label select. A
`focus-within` ring on that container therefore lights up for either — including when the select's
popup **closes** and focus returns to its trigger, which leaves the whole row ringed as though the
number were being edited. Between the trigger's own ring and the container's, opening a label read
as a flicker.

So the container's ring keys off the input alone (`has-[input:focus-visible]`), and the trigger
marks "open" with its border rather than a second ring nested inside the first. The ring means one
thing: you are editing the value.

## The record follows the design, and where it deliberately does not

The header card is **one row**: medallion, then the name with its relationship badge on the same
line, the identity (`poste · société · ville`) beneath, and the actions at the far right. The badge
qualifies the person, not the employer, so it belongs beside the name rather than under the
company. A record with neither job title nor city says so in a dashed hint rather than leaving the
line blank.

Most migrated contacts have no coordinates at all, so the reachability card is usually an
invitation rather than a list: a sentence naming why the record is bare, plus one chip per field.

Two deliberate departures from the canvas:

- **Every value carries a copy button**, which the design did not show. A number is pasted into
  another tool at least as often as it is dialled.
- **Nothing calls.** The design puts an "Appeler" action on the header, on every coordinate row
  and on the mobile listing card; none of them survive. A `tel:` link does nothing useful in the
  desktop browser this tool is used in, and the copy button covers the case that matters — the
  number goes into whatever actually places the call. Removing it also settles the header: there
  is one leading action, and it is editing.

The leading button is **Modifier**, in `outline`, in every state.

It was briefly filled, and said **Compléter la fiche** on a record with no job title and no city.
Both were wrong, for the same reason: the app header already carries the section's one filled CTA
("Nouveau contact"), so a solid button in the card directly beneath it put two competing primaries
on the same screen — the design draws this one outlined, beside the delete button. And what is
missing is already announced by the dashed "Poste et ville à renseigner" mention right above, so a
second label restating it made the button change identity for a state the page had already named.
One button, one label, one primary per screen.

"Lier une opportunité" opens the opportunity sheet **seeded with this contact** rather than a
picker of its own: linking a person to a mission and creating that mission from their record are
the same act, and the sheet already knows how to link. The seed takes part in the form's reset
identity, otherwise creating from one contact then another would reuse the first one's draft.

Notes render **whether or not there are any**. A card that only appears once written is one nobody
discovers, so the empty state is a button that opens the form.

## The record's title is a trail, not a name

On a contact's record the app bar swaps its two-line title/subtitle block for a breadcrumb:
**Contacts** (13.5px, muted, linking back to the listing) › the person's name at the same 18px
heading weight the title had. No subtitle — the trail already says where you are, and repeating
the name under it would say it twice.

That is also the way back. The record had its own back button for a moment; the breadcrumb
replaces it, which is what the design does and what keeps a phone from carrying two.

`BreadcrumbList` ships with `flex-wrap`, which drops a long name onto a second line and grows the
bar by 25px. The trail is `flex-nowrap` with a truncating name instead, so the bar keeps one
height whatever the person is called.

Unlike the header's count, this one is safe to read from the route: `useMatchRoute` returns
`false` for a route that is not active, where `useSearch` throws — see the section below.

### Adding to a list looks the same everywhere

Reachability ends with the **same dashed full-width row that ends every list in Customize**
(`AddButton`, moved out of the customization module to `src/components/` once a third module
wanted it). Adding to a list belongs at its foot, not as a small button in the card header —
that was a second dialect for one gesture.

The two cards beside each other stretch to a common height (`items-stretch`), and the add row
rides to the bottom of its card with `mt-auto`. Stretching alone would only have moved the ragged
edge inside the shorter card. On a narrow screen the columns stack and each sizes to its content,
which is correct — equal heights only mean something side by side.

### The record's skeleton is shaped by its content

`ContactDetailSkeleton` mirrors the record card for card and shares its layout classes, so the two
cannot drift. Nothing is pinned in pixels: known strings (titles, labels, the empty-state copy,
the chips, the buttons) are rendered with `SkeletonText` at their real size, and unknown values
are bars in line boxes (`h-lh`). Measured at desktop width, every card matches the loaded one.

Where the content varies, the skeleton takes the common record:

- **Reachability is the empty state** — most contacts arrive from the tracker with no coordinates.
- **Details shows company, last exchange and added on** — migrated contacts carry the ESN as
  their company; city is rare.
- **Opportunities shows one row** — the mission they came in on.

A long name wrapping on a phone still makes the header grow on arrival: the skeleton cannot know
the name's length.

## A listing row promises exactly one action

A row opens the record. So the reachability cell renders **nothing** when a contact has no phone
and no email — the dashed "Ajouter un numéro" affordance the design drew looked like its own
button but delivered the row's navigation, which is the one thing a control must never do.

Below `@3xl` the row becomes a card: the person on line one with the opportunity count and the row
menu beside them, the number on line two, and — under a rule — what they last brought. The rule sits on the _last_ line rather than between two, so a contact with no
coordinates still gets one separator instead of two.

## The header reads the contacts search, and it lives outside the route

`ContactsHeaderSubtitle` renders in the app header — above the router outlet, not inside the
contacts route. `useSearch({ from })` asserts its match is active, so during a navigation _away_
from the contacts page the header can re-render after that match is gone and throw
`Invariant failed: Could not find an active match`. The shell has no route boundary above it, so
the whole app fell into its error state and needed a "Retry" — intermittently, depending on render
order.

Anything route-bound that renders in the shell must therefore tolerate the match being absent:
`useOptionalContactsInput` passes `shouldThrow: false` and returns `null`, and the count query is
disabled until there is an input. It reads the panel's cache rather than fetching, so it also never
races the page it describes.

## Searching by phone number — the incoming call

A phone number is typed and stored in whatever shape each person prefers: `+33 6 12 34 56 78`,
`06 12 34 56 78`, `0612345678`. Matching them means reducing both sides to one canonical form.

**Stripping non-digits is not enough**, and getting this wrong is silent. `+33 6 12 34 56 78`
reduces to `33612345678`, the same number typed `06 12 34 56 78` reduces to `0612345678`, and
neither is a substring of the other — so the number you are staring at on the caller ID finds
nothing. `digits_only()` therefore also folds a leading `33` back to `0`, the national form
users actually type. Verified across all six shapes plus prefix and suffix fragments.

`contact_phone_digits()` normalises **each array entry separately** before joining. Joining
first and normalising after would let one number's tail run into the next one's head and match
a number nobody ever stored.

The client mirror is `digitsOf` in
[`contacts-sql.ts`](../../src/modules/contacts/contacts-sql.ts). **The two must agree exactly**
— they are one rule expressed twice, and a divergence shows up as a lookup that quietly misses.

A term only reaches the phone branch if it looks like a number (`isPhoneTerm`, in
[`utils/text.ts`](../../src/modules/contacts/utils/text.ts) — the same rule decides
whether a contact created from the picker gets the term as a number or as a name). A term reducing
to no digits is skipped entirely: an empty digit string would `LIKE '%%'` and match every
contact holding any phone number at all.

## Search and sort still work by recruiter name

The ticket's constraint: nothing is lost for the user. Both were preserved by moving them
through the join rather than dropping them.

- **Search** — `matchesSomeContact` is an `EXISTS` over the linked contacts, OR-ed into the
  same per-term group as the opportunity's own columns. It matches **any** linked contact, not
  only the primary one, so finding a mission by the engineer who interviewed you still works.
- **Sort** — `SORT_COLUMNS` renamed `recruiter` to `contact`, and the expression is a
  correlated subquery returning the position-0 contact's name. It is correlated rather than
  joined so an opportunity with **no** contact still returns its row; a join would drop it.

The `opportunities_user_pinned_recruiter_idx` index went with the column. Sorting now reads the
contacts table through the link, which is what `opportunity_contacts_opportunity_position_idx`
exists for.

### Correlated subqueries must qualify their columns by hand

Drizzle renders a column reference inside a `` sql`...` `` template as a **bare** name — `"id"`,
not `"contacts"."id"`. In a correlated subquery that is a trap: the moment the subquery joins a
table that has a column of the same name, the bare name binds to the inner table and the
correlation silently stops correlating. It does not error. It returns `NULL` for every row.

`lastExchange` shipped with exactly that bug: it joins `opportunities`, which has its own `id`,
so `where contact_id = "id"` compared `opportunity_contacts.contact_id` against
`opportunities.id` and matched nothing — which is why "Dernier échange" read _Jamais_ on every
contact regardless of the data.

The rule: **inside a subquery that joins more than one table, write the qualified name yourself**
(`opportunities.last_contact_at`) rather than interpolating the Drizzle column. `opportunityCount`
can interpolate freely only because `opportunity_contacts` has no `id` column of its own, so the
bare `"id"` still falls through to the outer `contacts.id`.

## The migration is one-way, and that is deliberate

[`drizzle/0008`](../../drizzle/0008_contacts_from_recruiters.sql) creates the tables, **backfills contacts
from the recruiter names, and only then drops the column**. Order matters: the backfill reads
the column it is about to destroy.

Distinctness is case- and accent-insensitive per user, so `Thomas Vasseur` and
`thomas vasseur` collapse into one relationship rather than two. The surviving spelling is the
one on the earliest opportunity, and the ESN carried by that same opportunity becomes the
contact's company — the best guess available from the data at hand.

Names split on the **last** space, and a single-word entry becomes a **last name alone**. The
app's own split (`splitFullName`) files a single word as a first name instead; the display is
the same either way, so the migrated rows were left as they are.
Splitting on the first space with `substr(name, strpos(name, ' ') + 1)` was tried and is wrong:
`strpos` returns 0 when there is no space, `substr(name, 1)` hands back the whole string, and
`Vanessa` lands in both columns.

This is a heuristic, not a name parser, and it does not detect particles: `Jean-Pierre Le Goff`
splits to `first = "Jean-Pierre Le"`, `last = "Goff"`. The **displayed** name is unaffected —
the two halves are concatenated back — so the cost is limited to sorting and to the structured
value, which the user can correct on the record. No split-on-space rule gets both a compound
first name and a particle right; splitting on the first space would break far more rows.

Internal whitespace is collapsed **before** grouping, and the split runs once in its own CTE
that both the insert and the join read. Skipping either lets `John  Doe` and `John Doe` form two
groups that split to the same `('John', 'Doe')`: the join then matches each opportunity to both
contacts and writes two position-0 links. Replayed on a copy of production carrying that exact
pair, the earlier shape produced 80 links for 78 opportunities; the current one produces 78,
with no opportunity holding more than one link.

Verified on a copy of production before running for real: 76 named opportunities → 52 contacts
and 76 links, zero names lost, every per-contact opportunity count preserved, no duplicated or
unidentified names.

There is deliberately **no cohabitation** — after the migration the recruiter text does not
exist anywhere, so the two representations cannot drift.

### The opportunity's phone moved onto the contact

`opportunities.phone` was the recruiter's number stored on the mission. Once contacts carry
their own numbers, the field said the same thing twice and the two could disagree, so
[`drizzle/0011`](../../drizzle/0011_opportunity_phone_to_contacts.sql) moves it and drops the
column — same one-way rule as the recruiter.

Each number lands on the opportunity's **primary** contact (position 0), the person it belonged
to. It is **appended**: a contact that already had a number keeps it as the one to call. Numbers
are compared on digits, as search compares them, so a number the contact already holds, or one
quoted by several of their opportunities, is added once. No label is invented.

Verified read-only before running: 59 opportunities with a number → 39 contacts, 39 numbers,
every resulting list passing `contacts_phones_shape`, none above the form's five-number cap. No
opportunity with a number lacked a primary contact, so nothing was dropped.

### Index expressions need IMMUTABLE, schema-qualified functions

Two traps cost a migration run each, both only visible against a real database:

- An index expression resolves function names with **no `search_path` of its own**, so
  `contact_phone_digits` calling a bare `digits_only(...)` fails at `CREATE INDEX` time. Every
  function here is `public.`-qualified, in its definition and at every call site — including the
  queries in `contacts-sql.ts`, which must match the indexed expression exactly or the planner
  silently ignores the index.
- `array_to_string` is **STABLE, not IMMUTABLE**, so it cannot appear in an index expression at
  all. `contact_emails_text` wraps `unnest`/`string_agg` to get an IMMUTABLE equivalent, the same
  remedy `0006` used for `unaccent`.

## RLS

`contacts` follows the `0001` shape exactly: owner column, `authenticated` only, one policy per
operation. `opportunity_contacts` carries no owner column of its own, so its policies check
ownership through the contact, and the INSERT **and UPDATE** policies check the **opportunity
side too**, on both `USING` and `WITH CHECK` — a crafted payload must not link one account's
opportunity to another's contact, and an UPDATE that only validated the contact would let a user
repoint their own contact at somebody else's opportunity by editing `opportunity_id`. The server
functions repeat that check because Drizzle bypasses RLS entirely; see
[`data-access-security.md`](data-access-security.md).

## See also

- [`data-model.md`](data-model.md) — the surrounding tables
- [`server-side-table.md`](server-side-table.md) — the search/sort/paging rules the contacts
  list follows too
- [`opportunity-form.md`](opportunity-form.md) — the form conventions the contact sheet mirrors
