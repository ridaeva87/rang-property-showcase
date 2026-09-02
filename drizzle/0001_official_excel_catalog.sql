CREATE TABLE "property_buildings" (
	"id" text PRIMARY KEY NOT NULL,
	"object_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"source_system" "integration_system" DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property_buildings" ADD CONSTRAINT "property_buildings_object_id_property_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."property_objects"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "property_buildings_object_code_uq" ON "property_buildings" USING btree ("object_id","code");
--> statement-breakpoint
CREATE UNIQUE INDEX "property_buildings_source_external_uq" ON "property_buildings" USING btree ("source_system","external_id");
--> statement-breakpoint
CREATE INDEX "property_buildings_object_idx" ON "property_buildings" USING btree ("object_id");
--> statement-breakpoint
ALTER TABLE "premises" ADD COLUMN "building_id" text;
--> statement-breakpoint
ALTER TABLE "premises" ADD CONSTRAINT "premises_building_id_property_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."property_buildings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "premises_source_external_uq" ON "premises" USING btree ("source_system","external_id");
--> statement-breakpoint
CREATE INDEX "premises_building_idx" ON "premises" USING btree ("building_id");
--> statement-breakpoint
CREATE TABLE "premise_components" (
	"id" text PRIMARY KEY NOT NULL,
	"premise_id" text NOT NULL,
	"component_type" text NOT NULL,
	"title" text NOT NULL,
	"floor" text,
	"area_sqm" numeric(12, 2),
	"rent_price_per_sqm" numeric(14, 2),
	"utility_costs" text,
	"ceiling_height" text,
	"heating" text,
	"material" text,
	"characteristics" jsonb,
	"source_row" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "premise_components" ADD CONSTRAINT "premise_components_premise_id_premises_id_fk" FOREIGN KEY ("premise_id") REFERENCES "public"."premises"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "premise_components_premise_order_uq" ON "premise_components" USING btree ("premise_id","sort_order");
--> statement-breakpoint
CREATE INDEX "premise_components_premise_idx" ON "premise_components" USING btree ("premise_id");
