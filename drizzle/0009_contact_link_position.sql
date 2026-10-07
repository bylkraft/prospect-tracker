DROP INDEX "opportunity_contacts_opportunity_position_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "opportunity_contacts_opportunity_position_key" ON "opportunity_contacts" USING btree ("opportunity_id","position");--> statement-breakpoint
ALTER TABLE "opportunity_contacts" ADD CONSTRAINT "opportunity_contacts_position_positive" CHECK ("opportunity_contacts"."position" >= 0);