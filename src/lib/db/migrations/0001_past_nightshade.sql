ALTER TABLE "agencies_contact" DROP CONSTRAINT "agencies_contact_agency_id_agencies_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "agencies_contact" ADD CONSTRAINT "agencies_contact_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;