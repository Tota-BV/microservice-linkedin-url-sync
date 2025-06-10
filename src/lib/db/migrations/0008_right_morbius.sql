ALTER TABLE "agencies_contact" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "agencies_contact" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "agencies_contact" ALTER COLUMN "agency_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "agencies_profile" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "agencies_profile" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();