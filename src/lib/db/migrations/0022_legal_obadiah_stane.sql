ALTER TABLE "candidates" ALTER COLUMN "hours_per_week" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "languages" json;