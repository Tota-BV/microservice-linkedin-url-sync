CREATE TYPE "public"."verification_status" AS ENUM('In progress', 'Approved', 'Rejected', 'Not submitted');--> statement-breakpoint
ALTER TABLE "agency_documents" ADD COLUMN "status" "verification_status" DEFAULT 'Not submitted' NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_documents" DROP COLUMN "verificationStatus";