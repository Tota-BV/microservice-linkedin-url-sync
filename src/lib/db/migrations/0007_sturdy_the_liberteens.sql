ALTER TABLE "agencies_profile" ALTER COLUMN "references_and_projects" SET DATA TYPE json[];--> statement-breakpoint
ALTER TABLE "agencies_profile" ALTER COLUMN "references_and_projects" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "agencies_profile" ALTER COLUMN "references_and_projects" DROP NOT NULL;