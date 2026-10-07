# Seed data

`pnpm db:seed` inserts 24 realistic opportunities into the Supabase database for one user, so
the dashboard can be exercised against real DB round-trips (SSR loaders, React Query,
pagination, sorting, filters) instead of mocks.

## Usage

```bash
pnpm db:seed                              # first user created, keeps existing rows
pnpm db:seed -- --email=you@example.com   # target a specific user
pnpm db:seed -- --reset                   # delete that user's opportunities first
pnpm db:seed -- --clear                   # delete only, insert nothing
```

**Always pass `--` before the flags.** `pnpm db:seed --email=x` lets pnpm swallow the flag, so
`--email` never reaches the script and it silently falls back to the oldest user — which seeds
the wrong account when several exist. The script prints `Target user: <email>` before writing,
so check that line.

`--clear` deletes the target user's opportunities and exits without inserting. It skips the
stage/job-type resolution entirely, so it works even on a user whose pipeline was never seeded.

The script reads `DATABASE_URL` from `.env` via `tsx --env-file=.env`. It never creates users:
the target must already exist in `public.users`, which happens on first login through
`provisionUser` (`src/modules/auth/auth-server.ts`). That call also seeds the user's stages,
job types and experience levels — the seed fails with an explicit message if they're missing.

## Why a standalone connection

`scripts/seed.ts` builds its own `postgres()` client rather than importing `src/db/client.ts`,
because that module pulls `@/lib/env`, which reads `import.meta.env` and only resolves inside
Vite. Same connection options (`prepare: false` for the Supabase transaction pooler).

## How the fixtures are written

Rows live in `scripts/seed-data.ts` and reference **seeded positions**, not names — stages,
job types and experience levels are user-renamable, so the script resolves each position to
the target user's own row ids at insert time. Positions follow `src/db/defaults.ts`
(stage 0 Sauvegardé → 6 Ghosté).

Dates are **day offsets from today**, not fixed ISO dates, so the due/stale KPIs keep
producing meaningful numbers however long after writing the fixtures the seed runs.

## What the 24 rows cover

24 rows = 3 pages at the default page size of 8, and the set is built to hit every UI branch:

| Aspect            | Coverage                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Pagination        | 24 active-tab rows across page sizes 8 / 10 / 15                                              |
| Stages            | all 7 positions, including the two terminal ones (Refusé active, Ghosté archived)             |
| Archived tab      | 2 rows — 1 via the archived Ghosté stage, 1 via the row's own `is_archived` flag              |
| Terminal stages   | 2 active rows in Refusé, which must never appear in the follow-up queue                       |
| Pinned            | 3 rows, to verify pinned-first ordering                                                       |
| Due today KPI     | 3 rows with `next_reminder_at` today or in the past, plus rows due via stage delay            |
| Stale KPI         | rows contacted more than 7 days ago in a stage still awaiting a reply                         |
| Interviews KPI    | 4 active rows in stage position 3                                                             |
| Response rate KPI | a mix of contacted / replied / no-reply rows                                                  |
| Nullable columns  | rows with null `esn` (7), `last_contact_at` (4), plus null `end_client`, `offer_url`, `notes` |
| Sorting & search  | varied recruiters, ESNs, end clients, locations and daily rates (420–700 €)                   |
| TJM reference     | rates on both sides of the 450 € default, for the above/below styling                         |
