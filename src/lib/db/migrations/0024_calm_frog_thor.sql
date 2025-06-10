ALTER TABLE "agency_documents" RENAME TO "agencies_documents";--> statement-breakpoint
ALTER TABLE "agencies_documents" DROP CONSTRAINT "agency_documents_agency_profile_id_agencies_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "agencies_documents" ADD CONSTRAINT "agencies_documents_agency_profile_id_agencies_profile_id_fk" FOREIGN KEY ("agency_profile_id") REFERENCES "public"."agencies_profile"("id") ON DELETE cascade ON UPDATE no action;