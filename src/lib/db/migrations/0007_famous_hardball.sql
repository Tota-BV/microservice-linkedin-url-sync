CREATE TABLE "agencies_contact" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"agency_id" text NOT NULL,
	"pronounce" text NOT NULL,
	"name" text NOT NULL,
	"name_prefix" text,
	"surname" text NOT NULL,
	"job_title" text NOT NULL,
	"phone_dial_code" text NOT NULL,
	"phone_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"country_code" text NOT NULL,
	"company_name" text NOT NULL,
	"company_number" text NOT NULL,
	"company_website" text NOT NULL,
	"street" text NOT NULL,
	"postal_code" text NOT NULL,
	"house_number" text NOT NULL,
	"house_number_addition" text,
	"city" text NOT NULL,
	"phone_dial_code" text NOT NULL,
	"phone_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dial_code" text NOT NULL,
	"emoji" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agencies_contact" ADD CONSTRAINT "agencies_contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_contact" ADD CONSTRAINT "agencies_contact_agency_id_agencies_profile_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies_profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_profile" ADD CONSTRAINT "agencies_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_profile" ADD CONSTRAINT "agencies_profile_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;