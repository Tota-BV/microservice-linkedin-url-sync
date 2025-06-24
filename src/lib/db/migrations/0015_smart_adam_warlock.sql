CREATE TABLE "candidates_profile" (
	"candidate_id" uuid NOT NULL,
	"availability" text,
	"profile_strength" text,
	"title" text,
	"description" text,
	"agency_summary" text,
	"skills" json DEFAULT '[]'::json NOT NULL,
	"experience" json DEFAULT '[]'::json NOT NULL,
	"education" json DEFAULT '[]'::json NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates_profile" ADD CONSTRAINT "candidates_profile_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;