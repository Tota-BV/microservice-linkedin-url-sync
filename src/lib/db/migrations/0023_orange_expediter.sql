CREATE TYPE "public"."doc_type" AS ENUM('business-registration', 'bank-account', 'customer-screening', 'tax-verification');--> statement-breakpoint
ALTER TABLE "agency_documents" ALTER COLUMN "type" SET DATA TYPE "public"."doc_type" USING "type"::text::"public"."doc_type";--> statement-breakpoint
DROP TYPE "public"."type";