-- Coordinates gain a label ("Mobile" / "Bureau") and an explicit order: entry zero is the number
-- we call. See docs/reference/contacts.md

-- The lookup indexes read the column, so they must go before the type changes under them and
-- come back rebuilt against jsonb.
DROP INDEX IF EXISTS "contacts_phones_digits_trgm_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "contacts_emails_unaccent_trgm_idx";--> statement-breakpoint

-- text[] does not cast to jsonb on its own. Every existing entry becomes {value, label:null}:
-- nothing recorded so far says whether a number is a mobile or a landline, and inventing that
-- would be worse than leaving it blank. Empty entries are dropped rather than migrated into a
-- shape the new CHECK constraint would reject.
-- A function, not an inline expression: a USING clause cannot contain a subquery.
CREATE OR REPLACE FUNCTION public.contact_labelled_entries(text[]) RETURNS jsonb
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT coalesce(jsonb_agg(jsonb_build_object('value', btrim(entry), 'label', null)), '[]'::jsonb)
        FROM unnest($1) AS entry WHERE btrim(entry) <> '' $$;--> statement-breakpoint

ALTER TABLE "contacts" ALTER COLUMN "emails" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "emails" SET DATA TYPE jsonb USING public.contact_labelled_entries("emails");--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "emails" SET DEFAULT '[]'::jsonb;--> statement-breakpoint

ALTER TABLE "contacts" ALTER COLUMN "phones" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "phones" SET DATA TYPE jsonb USING public.contact_labelled_entries("phones");--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "phones" SET DEFAULT '[]'::jsonb;--> statement-breakpoint

-- jsonb accepts any shape, so without these the column would take a bare string or a stray key.
-- A function again, and for the same reason as the cast above: a CHECK cannot hold a subquery.
-- Labels are passed in rather than hardcoded so one validator serves phones and emails.
CREATE OR REPLACE FUNCTION public.contact_entries_valid(jsonb, text[]) RETURNS boolean
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT jsonb_typeof($1) = 'array' AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements($1) AS entry
          WHERE jsonb_typeof(entry) <> 'object'
             OR jsonb_typeof(entry -> 'value') <> 'string'
             OR btrim(entry ->> 'value') = ''
             OR NOT (entry ? 'label')
             OR (entry -> 'label' <> 'null'::jsonb AND NOT ((entry ->> 'label') = ANY ($2)))
        ) $$;--> statement-breakpoint

ALTER TABLE "contacts" ADD CONSTRAINT "contacts_phones_shape"
  CHECK (public.contact_entries_valid("contacts"."phones", ARRAY['mobile','office']));--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_emails_shape"
  CHECK (public.contact_entries_valid("contacts"."emails", ARRAY['work','personal']));--> statement-breakpoint

-- Same lookup as before, reading the jsonb values instead of the array elements: the digit
-- folding itself (and so the incoming-call scenario) is unchanged. Schema-qualified because an
-- index expression resolves with no search_path of its own.
CREATE OR REPLACE FUNCTION public.contact_phone_digits(jsonb) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT coalesce(string_agg(public.digits_only(entry ->> 'value'), ' '), '') FROM jsonb_array_elements($1) AS entry $$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.contact_emails_text(jsonb) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT coalesce(string_agg(entry ->> 'value', ' '), '') FROM jsonb_array_elements($1) AS entry $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "contacts_phones_digits_trgm_idx" ON "contacts" USING gin (public.contact_phone_digits("phones") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_emails_unaccent_trgm_idx" ON "contacts" USING gin (immutable_unaccent(public.contact_emails_text("emails")) gin_trgm_ops);--> statement-breakpoint

-- The text[] overloads would still resolve for a stray caller and silently keep working.
DROP FUNCTION IF EXISTS public.contact_phone_digits(text[]);--> statement-breakpoint
DROP FUNCTION IF EXISTS public.contact_emails_text(text[]);--> statement-breakpoint
DROP FUNCTION IF EXISTS public.contact_labelled_entries(text[]);
