ALTER TABLE "agencies" ADD COLUMN "agency_description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agencies_profile" DROP COLUMN "agency_description";