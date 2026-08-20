CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'suspended', 'ended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."delivery_channel" AS ENUM('in_app', 'email', 'telegram', 'sms');--> statement-breakpoint
CREATE TYPE "public"."integration_system" AS ENUM('1c', 'excel', 'manual', 'other');--> statement-breakpoint
CREATE TYPE "public"."interest_kind" AS ENUM('viewing', 'application', 'release_waitlist', 'details');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'video', 'document');--> statement-breakpoint
CREATE TYPE "public"."meter_reading_source" AS ENUM('tenant', 'employee', 'import', 'integration');--> statement-breakpoint
CREATE TYPE "public"."offer_type" AS ENUM('rent', 'sale');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."recipient_kind" AS ENUM('user', 'organization', 'role', 'all');--> statement-breakpoint
CREATE TYPE "public"."request_visibility" AS ENUM('public', 'internal');--> statement-breakpoint
CREATE TYPE "public"."user_kind" AS ENUM('tenant', 'employee');--> statement-breakpoint
CREATE TABLE "accounting_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accruals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contract_id" text,
	"period_id" text NOT NULL,
	"category_id" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text DEFAULT 'RUB' NOT NULL,
	"source_system" "integration_system" DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"placement_id" text NOT NULL,
	"source" text,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"promo_applied" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_placements" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"offer_text" text,
	"promo_code" text,
	"discount_description" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "additional_services" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text,
	"title" text NOT NULL,
	"description" text,
	"price_description" text,
	"terms" text,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_recipients" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"kind" "recipient_kind" NOT NULL,
	"recipient_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"request_id" text,
	"ip_hash" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"type_id" text NOT NULL,
	"media_id" text NOT NULL,
	"organization_id" text,
	"contract_id" text,
	"premise_id" text,
	"object_id" text,
	"title" text NOT NULL,
	"document_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"period_id" text NOT NULL,
	"category_id" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text DEFAULT 'RUB' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"premise_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_premise_id_pk" PRIMARY KEY("user_id","premise_id")
);
--> statement-breakpoint
CREATE TABLE "integration_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"system" "integration_system" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"external_id" text NOT NULL,
	"payload_hash" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lease_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"number" text NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"source_system" "integration_system" DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lease_premises" (
	"contract_id" text NOT NULL,
	"premise_id" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	CONSTRAINT "lease_premises_contract_id_premise_id_starts_on_pk" PRIMARY KEY("contract_id","premise_id","starts_on")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "media_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text,
	"title" text,
	"description" text,
	"alt_text" text,
	"mime_type" text,
	"byte_size" integer,
	"width" integer,
	"height" integer,
	"duration_seconds" integer,
	"checksum_sha256" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meter_readings" (
	"id" text PRIMARY KEY NOT NULL,
	"meter_id" text NOT NULL,
	"value" numeric(16, 4) NOT NULL,
	"reading_at" timestamp with time zone NOT NULL,
	"submitted_by_user_id" text,
	"source" "meter_reading_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meter_types" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meters" (
	"id" text PRIMARY KEY NOT NULL,
	"premise_id" text NOT NULL,
	"type_id" text NOT NULL,
	"serial_number" text,
	"installed_on" date,
	"removed_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"announcement_id" text,
	"channel" "delivery_channel" DEFAULT 'in_app' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "object_media" (
	"object_id" text NOT NULL,
	"media_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "object_media_object_id_media_id_pk" PRIMARY KEY("object_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "organization_users" (
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_users_organization_id_user_id_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"tax_id" text,
	"registration_number" text,
	"source_system" "integration_system" DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premise_characteristics" (
	"id" text PRIMARY KEY NOT NULL,
	"premise_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"value_text" text,
	"value_number" numeric(14, 4),
	"unit" text,
	"group_name" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premise_media" (
	"premise_id" text NOT NULL,
	"media_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "premise_media_premise_id_media_id_pk" PRIMARY KEY("premise_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "premise_purposes" (
	"premise_id" text NOT NULL,
	"purpose" text NOT NULL,
	CONSTRAINT "premise_purposes_premise_id_purpose_pk" PRIMARY KEY("premise_id","purpose")
);
--> statement-breakpoint
CREATE TABLE "premise_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premise_types" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premises" (
	"id" text PRIMARY KEY NOT NULL,
	"object_id" text NOT NULL,
	"type_id" text NOT NULL,
	"status_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"area_sqm" numeric(12, 2),
	"usable_area_sqm" numeric(12, 2),
	"expected_release_on" date,
	"expected_release_label" text,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"source_system" "integration_system" DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_interests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"premise_id" text NOT NULL,
	"kind" "interest_kind" NOT NULL,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"description" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"parking" text,
	"access_mode" text,
	"territory_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"source_system" "integration_system" DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"premise_id" text NOT NULL,
	"type" "offer_type" NOT NULL,
	"status" text,
	"rent_price_per_sqm" numeric(14, 2),
	"total_monthly_rent" numeric(14, 2),
	"sale_price" numeric(16, 2),
	"purchase_terms" text,
	"utility_costs" text,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"valid_from" date,
	"valid_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"author_user_id" text,
	"visibility" "request_visibility" DEFAULT 'public' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"from_status_id" text,
	"to_status_id" text NOT NULL,
	"changed_by_user_id" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "request_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"created_by_user_id" text,
	"category_id" text NOT NULL,
	"status_id" text NOT NULL,
	"assignee_employee_id" text,
	"premise_id" text,
	"service_id" text,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "user_kind" NOT NULL,
	"email" text,
	"phone" text,
	"display_name" text NOT NULL,
	"password_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accruals" ADD CONSTRAINT "accruals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accruals" ADD CONSTRAINT "accruals_contract_id_lease_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."lease_contracts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accruals" ADD CONSTRAINT "accruals_period_id_accounting_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."accounting_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accruals" ADD CONSTRAINT "accruals_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_leads" ADD CONSTRAINT "ad_leads_placement_id_ad_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."ad_placements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_placements" ADD CONSTRAINT "ad_placements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "additional_services" ADD CONSTRAINT "additional_services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_type_id_document_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."document_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_contract_id_lease_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."lease_contracts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_object_id_property_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."property_objects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_period_id_accounting_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."accounting_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_contracts" ADD CONSTRAINT "lease_contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_premises" ADD CONSTRAINT "lease_premises_contract_id_lease_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."lease_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_premises" ADD CONSTRAINT "lease_premises_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meters" ADD CONSTRAINT "meters_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meters" ADD CONSTRAINT "meters_type_id_meter_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."meter_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "object_media" ADD CONSTRAINT "object_media_object_id_property_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."property_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "object_media" ADD CONSTRAINT "object_media_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premise_characteristics" ADD CONSTRAINT "premise_characteristics_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premise_media" ADD CONSTRAINT "premise_media_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premise_media" ADD CONSTRAINT "premise_media_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premise_purposes" ADD CONSTRAINT "premise_purposes_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premises" ADD CONSTRAINT "premises_object_id_property_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."property_objects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premises" ADD CONSTRAINT "premises_type_id_premise_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."premise_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premises" ADD CONSTRAINT "premises_status_id_premise_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."premise_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_interests" ADD CONSTRAINT "property_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_interests" ADD CONSTRAINT "property_interests_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_offers" ADD CONSTRAINT "property_offers_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_from_status_id_request_statuses_id_fk" FOREIGN KEY ("from_status_id") REFERENCES "public"."request_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_to_status_id_request_statuses_id_fk" FOREIGN KEY ("to_status_id") REFERENCES "public"."request_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_status_history" ADD CONSTRAINT "request_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_category_id_request_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."request_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_status_id_request_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."request_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_assignee_employee_id_employees_id_fk" FOREIGN KEY ("assignee_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_service_id_additional_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."additional_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_periods_dates_uq" ON "accounting_periods" USING btree ("starts_on","ends_on");--> statement-breakpoint
CREATE INDEX "accruals_org_period_idx" ON "accruals" USING btree ("organization_id","period_id");--> statement-breakpoint
CREATE INDEX "ad_leads_placement_idx" ON "ad_leads" USING btree ("placement_id");--> statement-breakpoint
CREATE INDEX "ad_placements_org_idx" ON "ad_placements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "announcement_recipients_announcement_idx" ON "announcement_recipients" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_types_code_uq" ON "document_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "documents_org_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "documents_contract_idx" ON "documents" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_user_uq" ON "employees" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_categories_code_uq" ON "expense_categories" USING btree ("code");--> statement-breakpoint
CREATE INDEX "expenses_org_period_idx" ON "expenses" USING btree ("organization_id","period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_mappings_external_uq" ON "integration_mappings" USING btree ("system","entity_type","external_id");--> statement-breakpoint
CREATE INDEX "integration_mappings_entity_idx" ON "integration_mappings" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lease_contracts_number_uq" ON "lease_contracts" USING btree ("number");--> statement-breakpoint
CREATE INDEX "lease_contracts_org_idx" ON "lease_contracts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "lease_premises_premise_idx" ON "lease_premises" USING btree ("premise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_storage_key_uq" ON "media_assets" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "meter_readings_meter_time_uq" ON "meter_readings" USING btree ("meter_id","reading_at");--> statement-breakpoint
CREATE UNIQUE INDEX "meter_types_code_uq" ON "meter_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "meters_premise_idx" ON "meters" USING btree ("premise_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "organizations_tax_id_idx" ON "organizations" USING btree ("tax_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_code_uq" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "premise_characteristics_key_uq" ON "premise_characteristics" USING btree ("premise_id","key");--> statement-breakpoint
CREATE INDEX "premise_characteristics_premise_idx" ON "premise_characteristics" USING btree ("premise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "premise_statuses_code_uq" ON "premise_statuses" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "premise_types_code_uq" ON "premise_types" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "premises_slug_uq" ON "premises" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "premises_object_idx" ON "premises" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX "premises_catalog_idx" ON "premises" USING btree ("publication_status","status_id");--> statement-breakpoint
CREATE INDEX "property_interests_premise_idx" ON "property_interests" USING btree ("premise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "property_objects_slug_uq" ON "property_objects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "property_objects_publication_idx" ON "property_objects" USING btree ("publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "property_offers_active_kind_uq" ON "property_offers" USING btree ("premise_id","type");--> statement-breakpoint
CREATE INDEX "property_offers_catalog_idx" ON "property_offers" USING btree ("type","publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "request_categories_code_uq" ON "request_categories" USING btree ("code");--> statement-breakpoint
CREATE INDEX "request_comments_request_idx" ON "request_comments" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_status_history_request_idx" ON "request_status_history" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "request_statuses_code_uq" ON "request_statuses" USING btree ("code");--> statement-breakpoint
CREATE INDEX "requests_org_idx" ON "requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "requests_assignee_status_idx" ON "requests" USING btree ("assignee_employee_id","status_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_uq" ON "roles" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "service_categories_code_uq" ON "service_categories" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_uq" ON "users" USING btree ("phone");