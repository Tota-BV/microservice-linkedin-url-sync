ALTER TABLE "agencies_profile" ALTER COLUMN "usps" SET DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "agencies_profile" ALTER COLUMN "skills" SET DEFAULT '[]'::json;