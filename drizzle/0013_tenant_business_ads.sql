ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "services" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "contacts" jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "social_links" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "video_url" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "logo_media_id" text REFERENCES "media_assets"("id") ON DELETE SET NULL;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "banner_media_id" text REFERENCES "media_assets"("id") ON DELETE SET NULL;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "gallery_media_ids" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "special_offer_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "special_offer_title" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "special_offer_type" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "special_offer_value" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "special_offer_starts_at" timestamptz;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "special_offer_ends_at" timestamptz;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "partner_status" text;
ALTER TABLE "ad_placements" ADD COLUMN IF NOT EXISTS "placement_terms" jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE "ad_placements" SET "slug" = regexp_replace(lower(coalesce("title", "id")), '[^a-zа-яё0-9]+', '-', 'g') || '-' || left("id", 8) WHERE "slug" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "ad_placements_slug_uq" ON "ad_placements" ("slug");
CREATE TABLE IF NOT EXISTS "ad_events" (
  "id" text PRIMARY KEY,
  "placement_id" text NOT NULL REFERENCES "ad_placements"("id") ON DELETE CASCADE,
  "tenant_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "event_type" text NOT NULL,
  "cta" text,
  "source" text NOT NULL DEFAULT 'rangpro.ru',
  "target_url" text,
  "is_confirmed_conversion" boolean NOT NULL DEFAULT false,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ad_events_placement_created_idx" ON "ad_events" ("placement_id", "created_at");
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rang_app') THEN
    ALTER TABLE "ad_events" OWNER TO "rang_app";
  END IF;
END $$;
