ALTER TABLE "agencies_documents" DROP CONSTRAINT "agencies_documents_agency_id_agencies_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "agencies_documents" ADD CONSTRAINT "agencies_documents_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;