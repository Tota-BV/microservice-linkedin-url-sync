ALTER TABLE "agencies_profile" ADD COLUMN "overview" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "agencies_profile" DROP COLUMN "about";