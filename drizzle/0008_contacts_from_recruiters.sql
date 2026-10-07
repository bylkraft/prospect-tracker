-- Contacts become a first-class entity (DEV-56). The recruiter text column is migrated into
-- `contacts` before it is dropped — no name entered so far may be lost.
-- Rationale and the reading directions this enables: docs/reference/contacts.md

CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text,
	"company" text,
	"job_title" text,
	"city" text,
	"emails" text[] DEFAULT '{}'::text[] NOT NULL,
	"phones" text[] DEFAULT '{}'::text[] NOT NULL,
	"linkedin_url" text,
	"relationship" text DEFAULT 'other' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_relationship_token" CHECK ("contacts"."relationship" in ('esn_manager','end_client','freelance','other')),
	CONSTRAINT "contacts_identified" CHECK (coalesce("contacts"."first_name", "contacts"."last_name", "contacts"."company") is not null)
);
--> statement-breakpoint
CREATE TABLE "opportunity_contacts" (
	"opportunity_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "opportunity_contacts_opportunity_id_contact_id_pk" PRIMARY KEY("opportunity_id","contact_id")
);
--> statement-breakpoint
-- IF EXISTS: this index is declared in 0004 but is absent from some environments, and the
-- trigram index on the same column is dropped by the column itself further down.
DROP INDEX IF EXISTS "opportunities_user_pinned_recruiter_idx";--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_contacts" ADD CONSTRAINT "opportunity_contacts_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunity_contacts" ADD CONSTRAINT "opportunity_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_user_last_name_idx" ON "contacts" USING btree ("user_id","last_name","first_name");--> statement-breakpoint
CREATE INDEX "contacts_user_company_idx" ON "contacts" USING btree ("user_id","company");--> statement-breakpoint
CREATE INDEX "opportunity_contacts_contact_idx" ON "opportunity_contacts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "opportunity_contacts_opportunity_position_idx" ON "opportunity_contacts" USING btree ("opportunity_id","position");--> statement-breakpoint
-- Backfill --------------------------------------------------------------------
-- One contact per distinct recruiter name per user. Distinct is case- and accent-insensitive
-- so "Thomas Vasseur" and "thomas vasseur" collapse into one relationship, and the surviving
-- spelling is the one from the earliest opportunity.
--
-- The name is split on the LAST space: a single-word entry becomes a last name alone rather than
-- landing in both columns. This is a heuristic, not a parser — a particle is not detected, so
-- "Jean-Pierre Le Goff" yields first="Jean-Pierre Le", last="Goff". The displayed name is
-- unaffected (the two are concatenated back), only the split is approximate, and the user can
-- fix it on the contact record. Splitting on the FIRST space is worse: it breaks every compound
-- first name.
WITH named AS (
  SELECT
    "user_id",
    "id" AS opportunity_id,
    "esn",
    "created_at",
    -- Internal runs of whitespace are collapsed here, so "John  Doe" and "John Doe" are one
    -- person. Leaving them apart would split the group but not the split name, and the join
    -- below would then match one opportunity to both contacts.
    btrim(regexp_replace("recruiter", '\s+', ' ', 'g')) AS recruiter
  FROM "opportunities"
  WHERE btrim(coalesce("recruiter", '')) <> ''
),
grouped AS (
  SELECT
    "user_id",
    lower(immutable_unaccent(recruiter)) AS recruiter_key,
    (array_agg(recruiter ORDER BY "created_at"))[1] AS recruiter,
    -- The ESN carried by the earliest opportunity is the best company guess available.
    (array_agg("esn" ORDER BY "created_at"))[1] AS company
  FROM named
  GROUP BY "user_id", lower(immutable_unaccent(recruiter))
),
-- Split once, reused by both the insert and the join, so the two can never disagree.
split AS (
  SELECT
    "user_id",
    recruiter_key,
    company,
    CASE WHEN strpos(recruiter, ' ') > 0
      THEN nullif(btrim(substr(recruiter, 1, length(recruiter) - strpos(reverse(recruiter), ' '))), '')
    END AS first_name,
    CASE WHEN strpos(recruiter, ' ') > 0
      THEN nullif(btrim(substr(recruiter, length(recruiter) - strpos(reverse(recruiter), ' ') + 2)), '')
      ELSE recruiter
    END AS last_name
  FROM grouped
),
created AS (
  INSERT INTO "contacts" ("user_id", "first_name", "last_name", "company", "relationship")
  SELECT
    "user_id",
    first_name,
    last_name,
    company,
    -- Every migrated name came from the recruiter field, which is what an ESN manager is.
    'esn_manager'
  FROM split
  RETURNING "id", "user_id", "first_name", "last_name"
)
INSERT INTO "opportunity_contacts" ("opportunity_id", "contact_id", "position")
SELECT named.opportunity_id, created."id", 0
FROM named
JOIN split
  ON split."user_id" = named."user_id"
 AND split.recruiter_key = lower(immutable_unaccent(named.recruiter))
JOIN created
  ON created."user_id" = split."user_id"
 AND created."first_name" IS NOT DISTINCT FROM split.first_name
 AND created."last_name" IS NOT DISTINCT FROM split.last_name;--> statement-breakpoint

-- The text field disappears entirely: no cohabitation between two ways of storing a recruiter.
ALTER TABLE "opportunities" DROP COLUMN "recruiter";--> statement-breakpoint

-- Row Level Security ----------------------------------------------------------
-- Same shape as 0001: owner column predicate, `authenticated` role only.
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "contacts_select_own" ON "contacts"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "contacts_insert_own" ON "contacts"
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "contacts_update_own" ON "contacts"
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "contacts_delete_own" ON "contacts"
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

-- The join table carries no owner column; ownership is the contact's, and the opportunity
-- side is checked too so a link can never cross two accounts.
ALTER TABLE "opportunity_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "opportunity_contacts_select_own" ON "opportunity_contacts"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "contacts" c
    WHERE c."id" = "contact_id" AND c."user_id" = (SELECT auth.uid())
  ));--> statement-breakpoint

CREATE POLICY "opportunity_contacts_insert_own" ON "opportunity_contacts"
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "contacts" c
      WHERE c."id" = "contact_id" AND c."user_id" = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM "opportunities" o
      WHERE o."id" = "opportunity_id" AND o."user_id" = (SELECT auth.uid())
    )
  );--> statement-breakpoint

-- Both sides on both clauses: checking only the contact would let a user repoint one of their
-- own contacts at somebody else's opportunity by editing opportunity_id.
CREATE POLICY "opportunity_contacts_update_own" ON "opportunity_contacts"
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "contacts" c
      WHERE c."id" = "contact_id" AND c."user_id" = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM "opportunities" o
      WHERE o."id" = "opportunity_id" AND o."user_id" = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "contacts" c
      WHERE c."id" = "contact_id" AND c."user_id" = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM "opportunities" o
      WHERE o."id" = "opportunity_id" AND o."user_id" = (SELECT auth.uid())
    )
  );--> statement-breakpoint

CREATE POLICY "opportunity_contacts_delete_own" ON "opportunity_contacts"
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "contacts" c
    WHERE c."id" = "contact_id" AND c."user_id" = (SELECT auth.uid())
  ));--> statement-breakpoint

-- Search indexes --------------------------------------------------------------
-- Hand-written like 0005/0006: Drizzle expresses neither GIN nor an expression index.
-- Both sides of every comparison go through `immutable_unaccent` or the index is skipped.
CREATE INDEX IF NOT EXISTS "contacts_first_name_unaccent_trgm_idx" ON "contacts" USING gin (immutable_unaccent("first_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_last_name_unaccent_trgm_idx" ON "contacts" USING gin (immutable_unaccent("last_name") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_company_unaccent_trgm_idx" ON "contacts" USING gin (immutable_unaccent("company") gin_trgm_ops);--> statement-breakpoint

-- The incoming-call lookup. A number is typed and stored in whatever shape the user likes, so
-- both sides are reduced to the same canonical digits before matching.
--
-- Stripping non-digits is not enough on its own: "+33 6 12 34 56 78" reduces to 33612345678
-- while the same number typed as "06 12 34 56 78" reduces to 0612345678, and neither is a
-- substring of the other. The French country code is therefore folded back to the national
-- leading zero, which is the form users actually type when a call comes in.
-- See docs/reference/contacts.md
CREATE OR REPLACE FUNCTION public.digits_only(text) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT regexp_replace(regexp_replace($1, '[^0-9]', '', 'g'), '^33', '0') $$;--> statement-breakpoint

-- Indexing the whole array as one digit string: `phones` holds a handful of entries, so the
-- concatenation is short, and a trigram match on it is exactly the "ends with 12 34" lookup.
-- Per entry, not on the joined string: joining first would let one number's tail run into the
-- next one's head and match a number nobody stored.
-- Schema-qualified like 0006's immutable_unaccent: an index expression resolves the call with
-- no search_path of its own, so a bare `digits_only(...)` fails at CREATE INDEX time.
CREATE OR REPLACE FUNCTION public.contact_phone_digits(text[]) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT coalesce(string_agg(public.digits_only(entry), ' '), '') FROM unnest($1) AS entry $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contacts_phones_digits_trgm_idx" ON "contacts" USING gin (public.contact_phone_digits("phones") gin_trgm_ops);--> statement-breakpoint

-- `array_to_string` is STABLE, not IMMUTABLE, so it cannot appear in an index expression.
-- Same remedy as the phone digits above: wrap it in an IMMUTABLE function of our own.
CREATE OR REPLACE FUNCTION public.contact_emails_text(text[]) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT coalesce(string_agg(entry, ' '), '') FROM unnest($1) AS entry $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contacts_emails_unaccent_trgm_idx" ON "contacts" USING gin (immutable_unaccent(public.contact_emails_text("emails")) gin_trgm_ops);
