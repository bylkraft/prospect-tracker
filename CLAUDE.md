# CLAUDE.md — ProspectTracker

Prospecting-tracker SaaS for freelancers, work-study students and job seekers.
Product reference: see `docs/PRD.md`.

`AGENTS.md` is a symlink to this file — every agent reads the same instructions.

**Language rule:** everything written for the team is **English** — code, comments, identifiers,
docs, commit messages, PR titles and descriptions, Linear tickets and comments. Only
end-user-facing UI copy (tracker labels, buttons, follow-up emails) is in **French** — the target
audience is French freelancers. Chatting with the user in French changes nothing: the artefact is
English even when the conversation around it is not.

## Stack

Full list in [README.md](README.md). The landing page and the dashboard live in the **same
TanStack Start app** (SSR): public routes for the LP, `_authed/*` for the dashboard.

Locked decisions (don't revisit without a strong reason):

- **Framework = TanStack Start** — table-centric product + SSR landing page in one app.
- **Auth = Supabase Auth** (not Better Auth / Clerk) — shared with the Supabase DB.
- **ORM = Drizzle** (not Prisma) — lightweight, SQL-first, edge-friendly.
- **Lint = ESLint** (flat config, typescript-eslint + react-hooks), **format = Prettier**.
- Single repo now; **pnpm-workspaces monorepo later** when the Chrome extension lands
  (it shares types via a future `packages/shared` but never touches the DB directly — API only).

## Repository layout

`src/routes/` (file-based routing: `__root.tsx`, public LP routes, `_authed/*` protected
dashboard, `api/auth.$.tsx`) · `src/modules/<domain>/` (everything domain-specific:
`createServerFn` handlers, schemas, hooks, components) · `src/shared/<mechanism>/`
(domain-free mechanisms with their own hooks and utils: `table/`, `sortable/`) ·
`src/components/{ui,layout,icons,theme}` (cross-cutting only) · `src/db/{schema.ts,client.ts}`
· `src/lib/{supabase,resend,stripe}.ts` · `drizzle/` (migrations). The Drizzle schema in
`src/db/schema.ts` is the source of truth for the data model.

- **`src/modules/<domain>/`** owns a whole domain: flat prefixed files at its root
  (`auth-schema.ts`, `auth-server.ts`, `auth-utils.ts`), **and a folder as soon as a kind of
  file reaches two** — `components/`, `hooks/`, `utils/`. One hook stays flat
  (`use-google-oauth.ts`); two move into `hooks/`. Files inside a folder drop the domain prefix
  (`hooks/use-opportunities.ts`, not `hooks/use-opportunities-opportunities.ts`) — the folder
  already says it. At the root the prefix stays, so editor tabs remain distinguishable: never a
  bare `schema.ts`.
- **`src/shared/<mechanism>/` is for what carries no domain at all** — reordering, tables. Same
  internal layout as a module (`components/`, `hooks/`, prefixed files at the root), but nothing
  inside knows what a stage or an opportunity is; a domain module supplies the data and the
  handlers. The test: if it needs a domain type to compile, it is a module, not a mechanism. Use
  it only when the thing is more than a component — a lone cross-cutting component belongs in
  `src/components/`.
- **`src/components/` is cross-cutting only** — reusable by any module, no domain knowledge
  (`ui/`, `layout/`, `error-state.tsx`). A component only one module uses belongs in that
  module.
- **`src/components/ui/` is the shadcn registry, nothing else.** Anything `pnpm dlx shadcn add`
  could overwrite lives there; our own compositions built _on top_ of it (`confirm-delete-dialog`,
  `animated-list`, `number-ticker`) sit at the root of `src/components/`. The test: could the CLI
  regenerate this file? If not, it does not belong in `ui/`.
- **`<domain>-server.ts` is a bundler boundary**: TanStack Start strips `createServerFn`
  handlers from the client bundle. Keep those files free of anything the client imports (Zod
  schemas belong in `<domain>-schema.ts`) — a shared const in a `-server.ts` file gets
  tree-shaken and reordered, which throws a TDZ `ReferenceError` at runtime.

## User identity (critical)

Supabase Auth owns accounts in `auth.users` (id = UUID). Our app `users` table **does not
re-implement auth** — it references the Supabase UUID as its key.

- `users.id` = **UUID = `auth.users.id`** (never a generated id).
- A `users` row is created on first login (upsert in the auth `createServerFn`, or a Postgres
  `on auth.users insert` trigger).
- All app FKs (`opportunities.user_id`, `reminders`…) point to `users.id`.

## Guest mode

Logged out = `localStorage`-only trial, migrated to the DB once on first dashboard load
after login. Rules: `docs/reference/guest-mode.md`.

## Code conventions

- **Files: kebab-case** (`user-card.tsx`), one component per file. Lib-imposed exceptions:
  `__root.tsx`, `routeTree.gen.ts`.
- **Components: PascalCase** inside the file (`export function UserCard()`).
- **Component props type: always name it `Props`** (file-local), never `UserCardProps` — one
  component per file makes the prefix redundant.
- Utility functions: camelCase.
- Code comments in English (see the language rule above).
- **Few comments.** Write only the non-obvious (security constraint, workaround,
  counter-intuitive decision, subtle ordering). No narration that restates the code or a
  function name. When in doubt, leave it out.
- **Explanations live in `docs/`, code carries a one-line pointer.** Anything needing real
  explanation (rationale, architecture, trade-offs, a rule that spans several files) goes in
  `docs/reference/` (`docs/decisions/` for ADRs). At the code site, leave a single line naming
  the reason and the file — never paste the explanation inline, and never let a multi-line
  comment grow where a doc belongs:

  ```ts
  // Nullable columns need both modifiers — see docs/reference/data-model.md
  const nullableText = z.string().trim().nullable().optional()
  ```

  Keep the path complete (clickable in the editor) and skip section anchors — titles change,
  paths rarely do. Update the doc, not the comment, when the reasoning evolves.

- **Never hand-roll a UI primitive.** Before writing a `<button>`, `<select>`, `<input>`, a
  tab bar, a dialog, a tooltip…, check `src/components/` and `src/components/ui/`, then the
  shadcn registry
  (`pnpm dlx shadcn@latest add <name>`). The project is on the **Base UI** style
  (`components.json` → `style: base-nova`), so the CLI installs the Base UI variant, not
  Radix — no new dependency. Hand-rolled controls lose focus rings, `disabled` semantics,
  keyboard nav and ARIA, and drift from the rest of the app. Only build custom after
  confirming nothing in the registry fits, and say why in the PR.
- **The type scale is recentred on a 14px body.** Write `text-sm` (14px) for body copy and
  `text-md` (16px) to promote a title. **Never write `text-base`** — it is pinned to 14px as
  the landing zone for imported shadcn components, and keeping it out of our own code is what
  lets it be retuned independently. See `docs/reference/design-tokens.md`.
- **Reuse an existing composition before inventing a new one.** A segmented control already
  exists (`locale-switcher.tsx`); a new one must look identical, not merely similar.
- Env vars in `.env` (never hardcoded, never committed).
- **Zod validation** (`.validator`) on every `createServerFn` before touching the DB.
- Strict typing, no `any`, `noUncheckedIndexedAccess` on. Use precise types.
- **No superfluous `export`.** Export a symbol only if it crosses a file boundary (actually
  imported elsewhere); keep file-local symbols unexported. Don't annotate a return type the
  compiler already infers — unless that annotation _is_ a shared contract reused elsewhere.
- Import alias `@/*` → `src/*` (always use existing aliases).
- Avoid unnecessary dependencies — prefer existing code / stdlib first.
- Keep changes focused — don't refactor unrelated files.
- Cover **mobile** and **dark-theme** states when relevant.
- **Tailwind: prefer native utilities over arbitrary values.** Use the spacing scale
  (`pt-5.5`, `size-3.75`, `w-61.5` — 1 unit = 4px) instead of `pt-[22px]`, `size-[15px]`. Keep
  arbitrary values only where no utility maps (e.g. exact font sizes `text-[12.5px]`, radii
  `rounded-[9px]`).

### Style

Single quotes, no semicolons, `trailingComma: none`, 2-space indent, width 100, JSX double
quotes, arrow parens always. Config makes the call: `.prettierrc.json`, `eslint.config.js`.

## Tooling & commands

pnpm 10, Node 24. Day-to-day scripts in [README.md](README.md); env vars in `.env.example`.
`husky` + `lint-staged` run `eslint --fix` and `prettier --write` on staged files.

Run the **CI gates** (same as `.github/workflows/quality-checks.yml`) before handing work back:

```bash
pnpm typecheck && pnpm lint:ci && pnpm format:check && pnpm test
```

`pnpm routes:gen` regenerates the gitignored `routeTree.gen.ts` (also runs on `pretypecheck`).

### Browser checks go through Orca, not a separate Chrome

Verify UI in **Orca's own browser** (`orca tab list --json`, `orca goto`, `orca snapshot`,
`orca eval`), never by opening an external Chrome tab. Two reasons, both load-bearing:

- That session already carries the auth cookies, so `/app/tracker` renders logged in. A fresh Chrome
  tab lands on `/login` and proves nothing.
- `orca eval --expression` runs JavaScript **inside the page**, which is the only way to test
  anything faster than a human click. The search debounce is 300 ms and a driven click costs
  more than that, so click-driven checks silently miss the race conditions that matter — see
  `docs/reference/server-side-table.md`.

React ignores `input.value = x`; drive inputs through the native setter plus an `input` event,
or the component never sees the change.

## Critical rules

- Never change `src/db/schema.ts` without generating a migration
  (`drizzle-kit generate` → `drizzle-kit migrate`).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Auth SSR: resolve the session in a `createServerFn` + `beforeLoad` (root for the current
  user, `_authed.tsx` to protect the dashboard). Identity checks must use a **verified** token —
  `getClaims()` (local signature check) or `getUser()` (Auth-server round-trip), **never**
  `getSession()`, which decodes without verifying. Which one goes where, and the signing-key
  assumption `getClaims()` depends on: `docs/reference/auth.md`.
- **RLS**: enable Row Level Security on app tables; user access via the authenticated Supabase
  client. Service-role access (Drizzle admin, crons) bypasses RLS — server only, never client.
- Email reminders run via a **Vercel cron** (server route) — never client-side.

## Contributions & Git

- **Conventional commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `ci:`, `test:`…).
  **Subject line only — no body.** Short imperative subject; put the _why_ in the PR
  description, not the commit.
- **Every commit MUST include a [gitmoji](https://gitmoji.dev/) after the colon**, in **text
  format** (`:emoji-name:`) — not the Unicode character.

  Format: `type(scope): :emoji: <description>`

  ```
  feat(cart): :sparkles: add quantity selector to cart line
  fix(auth): :bug: handle expired session token
  fix(deps): :lock: upgrade vulnerable packages
  chore(deps): :wrench: use caret ranges in pnpm overrides
  build(deps): :arrow_up: upgrade next to 16.2.6
  refactor(roster): :recycle: extract roster member validation
  perf(product): :zap: cache shopify product queries
  docs: :memo: update module architecture diagram
  test(cart): :white_check_mark: add unit tests for cart codec
  ```

  Cheat-sheet: `:sparkles:` feature · `:bug:` bug fix · `:lock:` security fix ·
  `:arrow_up:`/`:arrow_down:` up/downgrade deps · `:recycle:` refactor · `:wrench:`
  config/tooling · `:memo:` docs · `:white_check_mark:` tests · `:zap:` perf · `:art:`
  style/formatting · `:rocket:` deploy/release · `:fire:` remove dead code ·
  `:adhesive_bandage:` simple fix (not a real bug). Full list: https://gitmoji.dev/

- **Never add a `Co-Authored-By:` trailer or any "Generated with …" mention** (Claude, Codex or
  any other agent) in commits or PR bodies. No agent co-signature.
- Commit/push only when explicitly asked.
- One Linear ticket = one `dev-XX-…` branch (name provided by Linear) = one PR to `main`.
- **PR title: `DEV-XX · Short description`** — ticket id, a middle dot, then plain English.
  **Not** conventional-commit form, and no gitmoji: that format is for commits only.

  ```
  DEV-42 · Loading states between login and dashboard
  DEV-41 · App shell, sidebar and profile menu
  ```

- **PR description: an overview, not a technical write-up.** In **English**, like the title —
  see the language rule at the top. **Hard cap: 20 lines, 5 bullets.** Aim for ~15: a short
  paragraph on what changes for the user, then a handful of bullets. Over the cap, cut — do not
  reformat to fit. The reviewer reads the diff for the how — the description exists to say what
  to expect and where to look. Rules of thumb:

  - **No code blocks, no SQL, no timing tables, no before/after measurements.** A rationale that
    needs a paragraph belongs in `docs/reference/`; link it instead of inlining it.
  - **Name a new dependency or reusable pattern in one line** (what, and the rejected
    alternative in a half-sentence). If it deserves more, it deserves a doc.
  - **One line for mobile/dark** when the change is UI, one line for what was verified.
  - Anything deliberately left out or deferred to another ticket goes in a final short note.

  If the description no longer fits in a screen, the excess is documentation looking for a home.
