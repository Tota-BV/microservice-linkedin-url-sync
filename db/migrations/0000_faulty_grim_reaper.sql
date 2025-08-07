CREATE TYPE "public"."agency_doc_type" AS ENUM('business-registration', 'bank-account', 'customer-screening', 'tax-verification');--> statement-breakpoint
CREATE TYPE "public"."agency_verification_status" AS ENUM('in-progress', 'approved', 'rejected', 'not-submitted');--> statement-breakpoint
CREATE TYPE "public"."candidate_category" AS ENUM('developer', 'cyber', 'designer', 'project_manager', 'product_owner');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('basic', 'conversational', 'professional', 'fluent', 'native');--> statement-breakpoint
CREATE TYPE "public"."candidate_verification_status" AS ENUM('not-invited', 'invited', 'ready', 'validated', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('language', 'library', 'storage', 'tool', 'other');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('esco', 'user', 'admin');--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"country_code" text NOT NULL,
	"name" text NOT NULL,
	"agency_number" text NOT NULL,
	"website" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"street" text NOT NULL,
	"postal_code" text NOT NULL,
	"house_number" text NOT NULL,
	"house_number_addition" text,
	"city" text NOT NULL,
	"phone_dial_code" text NOT NULL,
	"phone_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"pronounce" text NOT NULL,
	"name" text NOT NULL,
	"name_prefix" text,
	"surname" text NOT NULL,
	"job_title" text NOT NULL,
	"phone_dial_code" text NOT NULL,
	"phone_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" "agency_doc_type" NOT NULL,
	"status" "agency_verification_status" DEFAULT 'not-submitted' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "agencies_office_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"city" text NOT NULL,
	"country_code" text NOT NULL,
	"is_primary" integer DEFAULT 0 NOT NULL,
	"timezone" text
);
--> statement-breakpoint
CREATE TABLE "agencies_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"overview" text DEFAULT '' NOT NULL,
	"usps" json DEFAULT '[]'::json NOT NULL,
	"skills" json DEFAULT '[]'::json NOT NULL,
	"references_and_projects" json DEFAULT '[]'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"last_purchase_at" timestamp,
	CONSTRAINT "agencies_tokens_agency_id_unique" UNIQUE("agency_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_i_d" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"two_factor_enabled" boolean,
	"role" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_name" text,
	"email" text NOT NULL,
	"profile_image_url" text,
	"linkedin_url" text,
	"working_location" text,
	"bio" text,
	"general_job_title" text,
	"current_company" text,
	"category" "candidate_category",
	"job_title_embedding" vector(1536),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "candidates_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"available" boolean,
	"hours_min" integer,
	"hours_max" integer,
	"working_hours_detail" json DEFAULT '{"monday":{"from":"08:00","to":"18:00"},"tuesday":{"from":"08:00","to":"18:00"},"wednesday":{"from":"08:00","to":"18:00"},"thursday":{"from":"08:00","to":"18:00"},"friday":{"from":"08:00","to":"18:00"}}'::json,
	"timezone_offset" text,
	"overlap_before" integer DEFAULT 0,
	"overlap_after" integer DEFAULT 0,
	"hourly_rate_min" integer,
	"hourly_rate_max" integer
);
--> statement-breakpoint
CREATE TABLE "candidates_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"title" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates_education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"degree_title" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"institution" text NOT NULL,
	"location" text
);
--> statement-breakpoint
CREATE TABLE "candidates_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"language" text NOT NULL,
	"proficiency" "verification_status" NOT NULL,
	CONSTRAINT "candidates_languages_candidate_id_language_unique" UNIQUE("candidate_id","language")
);
--> statement-breakpoint
CREATE TABLE "candidates_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"is_core" boolean DEFAULT false,
	CONSTRAINT "candidates_skills_candidate_id_skill_id_unique" UNIQUE("candidate_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "candidates_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"job_title" text,
	"company_name" text,
	"start_year" integer,
	"end_year" integer,
	"description" text[],
	"order" integer
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dial_code" text NOT NULL,
	"emoji" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"skillType" "type" NOT NULL,
	"source" "source" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"esco_id" text,
	"abbreviations" text[],
	"created_at" date DEFAULT now() NOT NULL,
	"updated_at" date DEFAULT now() NOT NULL,
	"embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_contact" ADD CONSTRAINT "agencies_contact_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_documents" ADD CONSTRAINT "agencies_documents_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_invoices" ADD CONSTRAINT "agencies_invoices_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_office_locations" ADD CONSTRAINT "agencies_office_locations_profile_id_agencies_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."agencies_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_office_locations" ADD CONSTRAINT "agencies_office_locations_country_code_countries_code_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_profile" ADD CONSTRAINT "agencies_profile_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies_tokens" ADD CONSTRAINT "agencies_tokens_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates_availability" ADD CONSTRAINT "candidates_availability_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates_certifications" ADD CONSTRAINT "candidates_certifications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates_education" ADD CONSTRAINT "candidates_education_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates_languages" ADD CONSTRAINT "candidates_languages_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates_skills" ADD CONSTRAINT "candidates_skills_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates_skills" ADD CONSTRAINT "candidates_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates_verification" ADD CONSTRAINT "candidates_verification_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_index" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_id_index" ON "account" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_index" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_index" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organization_id_index" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_id_index" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_slug_index" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "passkey_user_id_index" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credential_id_index" ON "passkey" USING btree ("credential_i_d");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_index" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "two_factor_user_id_index" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_index" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "user_email_index" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_id_index" ON "user" USING btree ("id");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_value_index" ON "verification" USING btree ("value");