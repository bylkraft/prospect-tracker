# The opportunity form

One right-hand sheet handles create and edit (`components/opportunity-sheet.tsx`). Everything
below is a decision that is not obvious from reading the component.

## How the sheet is split

`opportunity-sheet.tsx` is composition only — it wires the form to a header, three sections and
a footer, and owns nothing but the discard flag. The parts live in `components/sheet/`:

- `contact-section.tsx`, `mission-section.tsx`, `tracking-section.tsx` — the fields, one file per
  section, each built with `withForm`. `form-layout.ts` holds `EMPTY_FORM_VALUES` and the grid
  classes the three share.

`withForm` reads `defaultValues` for **type-checking only**, never at runtime, which is what
makes `EMPTY_FORM_VALUES` safe: it is `toFormValues(null, '')`, derived rather than spelled out,
so the field list stays in one place while the sheet still builds its real defaults from the
edited row. In exchange, `form.AppField name="…"` is checked against the actual form shape
inside each section, and the old `OpportunityForm = ReturnType<…>` alias is gone.

The two fixed bars, the submit button and the discard confirm are **not** here: `SheetFormHeader`,
`SheetFormFooter` and `SheetFormDiscardDialog` live in `components/sheet-form.tsx`, and the
CTA is the shared `SubmitButton` form component. Nothing about a bordered header bar, a
"discard changes?" alert or a submit button is specific to opportunities. What is specific are
the strings, which the sheet passes in, and the rule for when to show the confirm, below.

The footer sits outside the `<form>`, so the button reattaches to it by `form={FORM_ID}` rather
than by nesting.

The form itself lives in `hooks/use-opportunity-form.ts`: creating it, the reset-on-row-change
below, and the `discard` the dialog calls. That keeps the render-phase `if` out of the component
body, where it read as a stray branch in the middle of the JSX.

## Sheet, not Dialog or Drawer

All three are available; the differences matter.

`Sheet` and `Dialog` wrap the **same** Base UI `Dialog` primitive — same focus trap, same
`open`/`onOpenChange`. Only the positioning differs: the sheet pins to an edge
(`data-[side=right]`), the dialog centres.

`Drawer` is a different primitive (`@base-ui/react/drawer`). The gap is not cosmetic: it adds
drag-to-dismiss that tracks the finger, snap points, nested-drawer stacking, and live CSS
variables (`--drawer-swipe-progress`, `--drawer-swipe-strength`) driving backdrop opacity and
transition duration mid-gesture. **Sheet is a container, Drawer is an interaction.**

The sheet wins on both counts. A 580px panel keeps the table it edits visible alongside, which
a centred modal covers. And drag-to-dismiss is a hazard on a fifteen-field form: one stray
horizontal drag would discard everything typed — precisely what the discard guard below exists
to prevent. Drawer earns its keep on a sheet meant to be pulled by thumb, not here.

Below `sm` the sheet goes full-bleed. That needs `data-[side=right]:w-full`, not `w-full` —
the base class is itself a `data-[side=right]:` variant, so an unprefixed utility loses and
the panel stays at 75%, leaving a dead strip beside it.

## Where the state lives

The editor state sits in a context (`components/opportunity-editor-provider.tsx`) mounted in
`AppShell`, not in `OpportunitiesPanel`.

Two reasons:

- The **create CTA lives in the app header** (`components/layout/header.tsx`) and the rows that
  open the same sheet live in the panel. Neither is an ancestor of the other, so neither can
  own the state.
- `OpportunitiesPanel` returns early on its skeleton and its error state. Hosting the overlays
  there would make them unreachable exactly when the panel is not rendering its content.

The provider also renders the sheet and the delete dialog, so they survive whatever the panel
is doing.

`useForm` keeps the `defaultValues` it was created with, so switching row has to reload them.
The sheet **resets on row change** rather than carrying a `key={row.id}`: a key remounts the
component, and a component that mounts already-open skips its enter transition (see below) —
which is why edit used to appear abruptly while create slid in.

The reset happens **during render**, not in a `useEffect`: `rowId` is compared against a
`loadedRowId` state value, and a mismatch calls both `setLoadedRowId` and `form.reset()` in the
same pass — React's documented pattern for state derived from a prop. An effect would render
the previous row's stale values for one frame before catching up; adjusting during render skips
that frame entirely. The reset only runs while `open`. `row` drops to `null` on close, and
resetting then would wipe the create draft that is deliberately kept.

A **successful create** is the one case where that draft must go: it has become a saved row, and
reopening the sheet to find it still there reads as a failed save. The reset sits at the end of
the form's own `onSubmit`, after the `await` — which is only reached when the row was really
written, since a failed save rejects (see "On failure").

## String form, typed schema

Every field is held as a string: an `<input>` has no `null`, and a half-typed number is not yet
a number. `opportunityFormSchema` converts at the edge — blank strings become `null`, numeric
strings become numbers — then pipes into `opportunityFieldsSchema`, the same schema the server
validates with. Field rules are never duplicated.

The two directions are reciprocal, and each has one entry point:

```
row (DB types)                                     payload (DB types)
  │                                                       ▲
  │ toFormValues(row, fallbackStageId, today)             │ opportunityFormSchema.parse(values)
  │ utils/form-values.ts                                  │ opportunities-schema.ts
  ▼                                                       │
OpportunityFormValues ──────────── the form ──────────────┘
(every field a string)
```

They are deliberately **not** grouped into a single codec object. Only `toFormValues` is a
function; the other direction is a Zod schema that also runs as the form's live `onChange`
validator, so an object pairing the two would present as symmetric something that is not.

Both schemas live in `opportunities-schema.ts`, next to each other: the form schema is a
normalising front end for the server one, and splitting the pair across files only hid that.
The coercion it runs on the way through (`toNumeric`, `toOptionalText`) and its inverse
`toFormValues` (row → form strings) live together in `utils/form-values.ts` — string handling,
not field rules.

Two details worth keeping:

- **Non-numeric input stays a string** rather than becoming `NaN`. The load-bearing half is
  `Number(' ')`, which is `0` — a blank field would silently save as a rate of zero, so
  `toNumeric` returns `null` on an empty string before any parsing. `'abc'` is a belt-and-braces
  case: `z.int()` rejects the string and `NaN` alike, with the same `validation_dailyRateInt`
  message either way (verified by `opportunities-schema.test.ts`), so the `Number.isFinite`
  guard changes nothing the user can observe. Keep it for intent, not for behaviour.
- The schema starts from `z.custom<OpportunityFormValues>()` rather than a `z.object({...})`
  piped into the server schema. The server shape marks optional fields as `.optional()`, so its
  input type accepts `undefined`, which is wider than what the form ever produces — Zod v4 rejects
  that pipe on a variance check.

## Showing validation errors

The rule is shared with every other form — see `docs/reference/forms.md` for the full sequence.
The footer carries no status text: the asterisk on the recruiter label already marks it
required, and the disabled button already reads as "not ready".

Worth knowing, because it looks like it should break here: the sheet's `onChange` validator is
declared against `defaultValues` in which recruiter is empty, yet the button is still live when
the sheet opens. `canSubmit` stays `true` until the form is actually interacted with — the
validator does not run on mount — so the shared `!canSubmit` rule needs no special case for a
form whose defaults are invalid.

## Mounting, so the transitions run

Both overlays are mounted unconditionally and driven by their `open` prop — `open={editor !== null}`,
not `{editor && <Sheet open />}`.

A component that mounts already-open never gets a `data-starting-style` frame, so Base UI has no
state to transition _from_ and the panel simply appears. Keeping it mounted lets `open` flip
false → true on a live element, which is what triggers the slide-in (and the slide-out on close,
which a conditional mount would cut off entirely by unmounting immediately).

The delete dialog keeps its last `recruiter` in state for the same reason: `deleting` clears the
moment it closes, and the title would otherwise blank out mid-exit. State rather than a ref —
the value is rendered, and `react-hooks/refs` rightly rejects reading a ref during render.

## One line under the control, never two

Every field says at most one thing at a time, and it says it in the same place: a single slot
under the control, holding the error when there is one and the hint otherwise (`FormField`).

The notes counter goes through that same `hint` slot rather than sitting beside the label. It
used to, via a `labelSuffix` prop, which made it the only piece of help text in the form
rendered _above_ its control — and left the prop covering two unrelated jobs, a live counter
here and the "forgot password" link on the auth screens.

Collapsing the counter into `hint` means an error would hide it. That is safe here and only
here: `maxLength` on the textarea stops the browser at 500 characters, so the `.max()` rule in
the schema is a server-side backstop that the UI cannot actually trip. A field that can show a
real validation error must not use the hint slot for live state this way.

The counter shifts tone as the room runs out — neutral, then `--warning` at 20% left, then
`--destructive` at 5% and at the limit. The thresholds are ratios of `NOTES_MAX_LENGTH`, so
changing the limit keeps them proportional. `--warning` is its own token rather than a reuse of
`--stage-amber`: the stage palette identifies pipeline stages, and borrowing a hue from it would
tie an unrelated meaning to a token the stages own.

The count and the two thresholds live in `utils/display.ts` (`notesRemaining`,
`notesRemainingHint`, `notesRemainingTone`) rather than in the section component, so the
thresholds stay testable and a second caller would not have to reach into a component for them.
They sit with the other presentation helpers — `formatDailyRate`, `ONSITE_DAYS_OPTIONS` — while
`utils/rows.ts` keeps the domain model it owes nothing to.

## Deleting from the sheet

Editing offers **Supprimer** in the footer's far left, apart from Annuler and Enregistrer, so it
can never be hit while reaching for Save. Creation has no such button: there is nothing to delete
yet.

The sheet closes before the confirmation opens — a dialog raised over a sheet renders behind it.
Both the contact sheet and the opportunity sheet do exactly this, through `SheetFormFooter`'s
`destructiveCta` slot; the two records are edited the same way, so they are deleted the same way.

## Discarding a dirty form

**Create and edit alike.** Closing a form that holds unsaved input asks first, whichever mode
it is in. Create used to be exempt, on the grounds that its draft survived close and reopen —
but that reasoning only held while nothing else could clear the draft. Confirming a discard
now resets create too, so the exemption would have meant losing a half-filled form to a stray
Escape with no warning at all.

The check is `!form.state.isDefaultValue`, the **same signal the save button uses**, so the two
can never disagree: a form the button says has nothing to save is a form that closes without
asking. `isDirty` latches the moment a field is touched and never unlatches, so it warned about
changes that had been typed and then undone.

That equivalence is the reason the rule can be symmetric at all. An untouched create form sits
exactly on its defaults — including today's date in `lastContactAt` — so opening the sheet and
closing it immediately is silent. Only real input triggers the confirm.

Confirming the discard **resets the form**, back to the stored row when editing and to empty
defaults when creating. Reopening runs no reset of its own — the id has not changed, and for
create there is no id — so without this the abandoned input would still be sitting there and
"Abandonner" would abandon nothing.

Every exit funnels through one `requestClose()`: the X, Cancel, Escape and the backdrop. That
matters for the X in particular, which is a plain `Button` rather than a `SheetClose` —
`SheetClose` dismisses the sheet through the primitive directly and would skip the check.
Escape and the backdrop are covered because `onOpenChange` intercepts a close before it happens.

The confirm is an `AlertDialog` rendered inside the `Sheet`, so the sheet stays mounted behind
it and keeps the input while the user decides. Submitting is exempt (`isSubmitting`): the sheet
closes itself on success, and that is not a discard.

It needs both `forceOverlay` and `z-70`. Base UI **omits the backdrop of a nested dialog** by
design, so the parent stays visible — here that left the sheet fully sharp behind the confirm.
`forceRender` brings the backdrop back, and the raised z-index puts it above the sheet's own
`z-50` instead of underneath it.

## Layout

Implemented from `docs/design/new-opportunity-v2.html`. Three sections (contact, mission,
tracking), each a two-column grid where the fields carrying a long value (offer link, need,
stage, notes) span both columns.

Section titles are centred between two rules rather than sitting left of a single one, which
gives the blocks a clearer rhythm down a tall panel. **The contact section carries no title** —
the sheet header already says "Nouvelle opportunité" two lines above, so a heading there only
repeated it. `SheetFormSection` takes an optional `title` for that reason — it lives in
`components/sheet-form.tsx` with the rest of the sheet chrome, not under `components/form/`:
it is a layout block with no TanStack Form involvement, and the sheet is its only caller.

The header pairs the title with an icon in a tinted square — `Plus` on create, `Pencil` on edit —
so the mode is readable before the fields are.

The header and footer sit outside the scrollable body and carry a `border-b` / `border-t`, so
the submit button stays reachable however far down the user has scrolled.

Form controls use a denser, **filled** treatment than the app default: `size="form"` (35px,
9px radius, 13.5px text) with `variant="filled"` (`--secondary` background). The default
transparent 44px input is still what the auth screens use — a login form with four fields wants
the roomier control; a panel with a dozen fields does not.

`SelectTrigger`'s heights mirror `inputVariants` at every size, so a select and an input sit
level side by side. They used to be 32px against the input's 44px, which showed as a 12px step
wherever the two shared a row.

Geist Mono is **not** installed, so the phone and day-rate fields use `tabular-nums` rather than
the mockup's monospace face. Adding a second family for two fields was not worth the dependency.

The date fields are native `<input type="date">`. shadcn has no installable date-picker — its
docs page is a _pattern_ composing `calendar` + `popover`, and `calendar` pulls in
`react-day-picker` and `date-fns`. Native keeps the OS picker, keyboard entry, mobile wheels and
locale formatting for free; the cost is that the `dd/mm/yyyy` rendering is the browser's and
does not match the other fields. Deliberate trade-off — revisit only if the mismatch starts
costing more than two dependencies would.

## Stage as a radio group, not a select

`StagePicker` renders every offered stage as a pill. The pipeline is short, ordered and colour-coded,
so a dropdown would hide six options and drop the colour that the rest of the app uses to
identify a stage. It exposes `role="radiogroup"` / `role="radio"`, so it stays keyboard- and
screen-reader-addressable despite not being a native control.

The selected pill borrows the stage's own colour for its border and a 12% wash of the same hue,
rather than a generic "selected" treatment — the chip reads as _that stage_, matching how the
table badges identify one. Those two values are inline styles because the colour comes from the
row's `--stage-*` token at runtime, which no static class can express.

### Archived stages are not offered

Archiving a stage means putting the column away, so it stops being a destination: the picker
lists active stages only ([`selectableStages`](../../src/modules/stages/stages-utils.ts)).
Otherwise a stage the user had deliberately hidden — Ghosté, which ships archived — stayed one
tap away in the form, and moving a row into it made that row vanish from the active tab as a
side effect of the archived stage it now sat in.

**One exception: the stage the edited opportunity is already in.** A row can sit in an archived
stage (it is how the archived tab is populated), and removing that pill would leave the group
with nothing selected — the form would then either block on a required field or, worse, save the
row into a different stage the user never picked. So the current stage is always offered, and
only on the row being edited.

The same filtered list feeds the fallback for a **new** opportunity, which is the first offered
stage rather than the first stage outright. Preselecting an id that the picker does not list
would render an empty selection that the user cannot reproduce by clicking.

## Selects and null

`SelectField` passes `null` to Base UI for "no selection" rather than a `'__none__'` sentinel.
A sentinel leaks into the hidden native input Base UI renders for the select, which would submit
it verbatim in a native form post.

`SelectValue` also needs a child function to resolve an id to its label — left alone it renders
the raw value, so the trigger would show a UUID.

## ⌘K

`useHotkey` is registered in the provider, not the header, so the shortcut works from anywhere
in the dashboard. It is disabled while the sheet or the delete dialog is open, otherwise ⌘K
inside the form would stack a second editor on top of the first.

`useMetaKeyLabel` resolves ⌘ vs Ctrl **after mount**: the server cannot know the platform, so
picking during render would be a hydration mismatch. Both sides render `Ctrl` and macOS swaps
after hydration.

## On failure

The mutations own the error toast (`use-opportunity-mutations.ts`). `submit` lets the rejection
through and only closes the sheet after the mutation resolves, so a failed save leaves the sheet
open with whatever the user typed — closing it would throw the input away.

It rethrows rather than swallowing because success and failure have to be distinguishable: the
create reset above hangs off that same promise. TanStack Form rethrows out of `handleSubmit`
after clearing `isSubmitting`, so the sheet's `onSubmit` catches it — the toast is already
handled, and the `catch` exists only to keep the rejection from going unhandled.

## The suggested follow-up date

Creating an opportunity prefills **both** dates: `last_contact_at` with today, and
`next_reminder_at` with today plus the stage's `reminder_delay_days`. The user sees the real date
in the field instead of an abstract promise, and can move it before saving.

This is a form convenience, not the rule. The server still resolves the due date with
`coalesce(next_reminder_at, last_contact_at + stage.reminder_delay_days)`, so anything writing
outside this form — an import, the Chrome extension, the reminder cron — still gets a correct due
date without having to replicate the calculation.

The hint reflects which side is in charge: while the value still equals what the delay would
produce ([`isAutomaticReminder`](../../src/modules/opportunities/utils/form-values.ts)) it reads
_"Relance auto · 7 j après le dernier contact"_; move the date off that and it switches to how to hand
control back. That check drives the hint only — it no longer gates the re-derivation below.

**The delay always comes from the selected stage**, never a constant: `reminder_delay_days` is a
per-stage column whose `7` is only a database default, so whatever the Personnaliser screen writes
takes effect everywhere at once. Because each stage carries its own delay, changing the stage
re-derives the suggested date — 7 days becomes 14 the moment the row moves to a stage configured
that way, and the hint follows.

**The reminder always follows the last contact**, on create and on edit alike:

| Action                                        | Reminder                       |
| --------------------------------------------- | ------------------------------ |
| Logging a contact 3 days in (stage unchanged) | new contact date + stage delay |
| Moving to a stage with a different delay      | contact date + the new delay   |
| Either of the above, after typing a date      | recomputed, overwriting it     |

Note the first row: the reminder is recomputed from the **new** contact date, not shifted by the
delay from where it already sat. Following up early therefore pulls the next reminder earlier
rather than stacking onto the old one.

The third row is a deliberate reversal. The field used to be left alone once its value stopped
matching the derived one, on the theory that a mismatch meant the user had chosen it. On a stored
row that reasoning collapses: `next_reminder_at` almost never equals `last_contact_at + delay` by
the time the sheet reopens — a forced date, a past reschedule, or a plain `coalesce()` all break
the equality — so the guard read every existing row as user-picked and froze the field exactly
where updating it mattered most. A date that silently contradicts the contact it hangs off is
worse than one rewritten in plain sight, so the rule is now unconditional and the rewrite is
[highlighted](../../src/modules/opportunities/components/sheet/tracking-section.tsx) for a beat
instead of hidden.

The date is assembled from local parts rather than `toISOString()`. The value is built at local
midnight, and converting it to UTC shifts it a day back for anyone east of Greenwich — the same
trap [`today.md`](today.md) documents for `useToday()`.
