CREATE TABLE "agencies_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"last_purchase_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "agencies_tokens" ADD CONSTRAINT "agencies_tokens_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;