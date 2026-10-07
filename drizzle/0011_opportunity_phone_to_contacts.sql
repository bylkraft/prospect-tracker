-- The number belongs to the person, not the mission: each opportunity's phone moves onto its
-- primary contact before the column goes. See docs/reference/contacts.md

-- Appended after the contact's own numbers, so a number already marked as the one to call keeps
-- its place; a contact with none gets this one as its first. A number the contact already holds
-- (compared on digits, the way search compares them) is not added twice, and two opportunities
-- quoting the same number add it once. No label: nothing recorded says mobile or landline.
WITH candidates AS (
  SELECT DISTINCT ON (oc.contact_id, public.digits_only(o.phone))
    oc.contact_id, btrim(o.phone) AS value, o.created_at
  FROM "opportunities" o
  JOIN "opportunity_contacts" oc ON oc.opportunity_id = o.id AND oc.position = 0
  JOIN "contacts" c ON c.id = oc.contact_id
  WHERE nullif(btrim(o.phone), '') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(c.phones) AS entry
      WHERE public.digits_only(entry ->> 'value') = public.digits_only(o.phone)
    )
  ORDER BY oc.contact_id, public.digits_only(o.phone), o.created_at
),
moved AS (
  SELECT contact_id,
    jsonb_agg(jsonb_build_object('value', value, 'label', null) ORDER BY created_at) AS entries
  FROM candidates
  GROUP BY contact_id
)
UPDATE "contacts" c SET phones = c.phones || moved.entries
FROM moved
WHERE c.id = moved.contact_id;--> statement-breakpoint

ALTER TABLE "opportunities" DROP COLUMN "phone";
