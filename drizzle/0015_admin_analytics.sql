CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "source" text NOT NULL,
  "event_type" text NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "object_id" text REFERENCES "property_objects"("id") ON DELETE SET NULL,
  "premise_id" text REFERENCES "premises"("id") ON DELETE SET NULL,
  "service_id" text REFERENCES "additional_services"("id") ON DELETE SET NULL,
  "ad_placement_id" text REFERENCES "ad_placements"("id") ON DELETE SET NULL,
  "context" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "analytics_events_type_created_idx" ON "analytics_events" ("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_premise_created_idx" ON "analytics_events" ("premise_id", "created_at");
