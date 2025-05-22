DO $$ 
BEGIN
    -- Drop existing enums if they exist
    DROP TYPE IF EXISTS "public"."consultation_mode" CASCADE;
    DROP TYPE IF EXISTS "public"."consultation_status" CASCADE;
    DROP TYPE IF EXISTS "public"."contract_status" CASCADE;
    DROP TYPE IF EXISTS "public"."contract_type" CASCADE;
    DROP TYPE IF EXISTS "public"."practice_area" CASCADE;
    DROP TYPE IF EXISTS "public"."party_role" CASCADE;
    DROP TYPE IF EXISTS "public"."payment_status" CASCADE;
    DROP TYPE IF EXISTS "public"."payment_type" CASCADE;
    DROP TYPE IF EXISTS "public"."subscription_plan" CASCADE;
    DROP TYPE IF EXISTS "public"."subscription_status" CASCADE;
    DROP TYPE IF EXISTS "public"."verification_status" CASCADE;
END $$;

CREATE TYPE "public"."consultation_mode" AS ENUM('video', 'call', 'chat');--> statement-breakpoint
CREATE TYPE "public"."consultation_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'pending', 'signed', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('nda', 'freelance', 'employment', 'founder', 'lease', 'sale_of_goods', 'distribution', 'franchise', 'agency', 'joint_venture', 'partnership', 'consulting', 'outsourcing', 'maintenance', 'logistics', 'loan', 'investment', 'venture_capital', 'guarantee', 'security', 'property_sale', 'rent_residential', 'rent_commercial', 'construction', 'development', 'ip_licensing', 'ip_transfer', 'technology_transfer', 'software_development', 'publishing', 'e_commerce', 'startup_incorporation', 'fdi_compliance', 'gst_compliance', 'msme', 'other');--> statement-breakpoint
CREATE TYPE "public"."practice_area" AS ENUM('contract_law', 'property_law', 'criminal_law', 'corporate_law', 'family_law', 'intellectual_property', 'startup_law', 'real_estate', 'tax_law', 'employment_law', 'immigration_law', 'environmental_law', 'bankruptcy_law', 'constitutional_law', 'entertainment_law', 'medical_law', 'cyber_law', 'international_law', 'human_rights', 'other');--> statement-breakpoint
CREATE TYPE "public"."party_role" AS ENUM('client', 'provider', 'employer', 'employee', 'lessor', 'lessee', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('consultation', 'subscription', 'contract_analysis', 'document_generation', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'basic', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'expired', 'trial', 'past_due');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"messages" json NOT NULL,
	"context" text,
	"contract_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"sender_id" text NOT NULL,
	"content" text NOT NULL,
	"attachments" json[],
	"read" boolean DEFAULT false NOT NULL,
	"related_entity_id" integer,
	"related_entity_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"type" text NOT NULL,
	"participants" text[] NOT NULL,
	"last_message_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clauses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"address" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lawyer_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"mode" "consultation_mode" NOT NULL,
	"status" "consultation_status" DEFAULT 'scheduled',
	"documents" json[],
	"price" integer NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"payment_id" text,
	"notes" text,
	"transcription" text,
	"lexi_assist_enabled" boolean DEFAULT false,
	"lexi_cert_id" text,
	"feedback_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"risk_score" integer,
	"completeness" integer,
	"issues" json[],
	"strengths" json[],
	"weaknesses" json[],
	"recommendations" json[],
	"compliant_with_indian_law" boolean,
	"analysis_metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" "contract_type" NOT NULL,
	"content" text NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"jurisdiction" text NOT NULL,
	"user_id" text NOT NULL,
	"pdf_url" text,
	"parties" json NOT NULL,
	"clauses" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"version" integer NOT NULL,
	"content" text NOT NULL,
	"changes" json,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"lawyer_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"consultation_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lawyers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"profile_photo" text,
	"about" text,
	"bar_council_id" text,
	"practice_areas" text[] NOT NULL,
	"specializations" text[],
	"experience" integer DEFAULT 0 NOT NULL,
	"languages" text[] NOT NULL,
	"location" json NOT NULL,
	"rating" integer DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"hourly_rate" integer NOT NULL,
	"is_available" boolean DEFAULT true,
	"availability_calendar" json,
	"verified" boolean DEFAULT false,
	"verifications" json DEFAULT '{"barCouncil":false,"aadhaar":false,"email":false,"phone":false,"lexiScreened":false}'::json,
	"awards" json[],
	"education" json[],
	"consultation_modes" text[],
	"badges" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"metadata" json,
	"related_entity_id" integer,
	"related_entity_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"type" "payment_type" NOT NULL,
	"payment_method" text,
	"payment_provider" text,
	"payment_provider_id" text,
	"metadata" json,
	"related_entity_id" integer,
	"related_entity_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"consultation_id" integer NOT NULL,
	"name" text NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"type" text,
	"size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"trial_ends_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"payment_provider_id" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" "contract_type" NOT NULL,
	"content" text NOT NULL,
	"description" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"user_id" text,
	"clauses" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"uid" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text,
	"avatar" text,
	"is_verified" boolean DEFAULT false,
	"verification_token" text,
	"verification_token_expiry" timestamp,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_uid_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clauses" ADD CONSTRAINT "clauses_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_lawyer_id_lawyers_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_analyses" ADD CONSTRAINT "contract_analyses_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_analyses" ADD CONSTRAINT "contract_analyses_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_created_by_users_uid_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_reviews" ADD CONSTRAINT "lawyer_reviews_lawyer_id_lawyers_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_reviews" ADD CONSTRAINT "lawyer_reviews_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_documents" ADD CONSTRAINT "shared_documents_uploaded_by_users_uid_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;