CREATE TABLE "agency_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_documents" ADD CONSTRAINT "agency_documents_agency_profile_id_agencies_profile_id_fk" FOREIGN KEY ("agency_profile_id") REFERENCES "public"."agencies_profile"("id") ON DELETE cascade ON UPDATE no action;