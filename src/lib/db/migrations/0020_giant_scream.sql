CREATE TABLE "agencies_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"purchased_at" timestamp,
	"amount" integer NOT NULL,
	"status" text,
	"invoice_type" text,
	"invoice_url" text,
	"invoice_pdf" text
);
--> statement-breakpoint
ALTER TABLE "agencies_invoices" ADD CONSTRAINT "agencies_invoices_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;