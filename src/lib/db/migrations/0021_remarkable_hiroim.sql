ALTER TABLE "candidates" RENAME COLUMN "availability_from" TO "availability";--> statement-breakpoint
ALTER TABLE "candidates" DROP COLUMN "availability_to";