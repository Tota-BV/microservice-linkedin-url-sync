ALTER TABLE "candidates" ALTER COLUMN "date_of_birth" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "availability_from" date;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "availability_to" date;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "price_from" numeric;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "price_to" numeric;--> statement-breakpoint
ALTER TABLE "candidates_profile" DROP COLUMN "availability";