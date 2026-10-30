CREATE TABLE IF NOT EXISTS "seo_page_settings" (
  "id" text PRIMARY KEY,
  "page_key" text NOT NULL,
  "title" text,
  "description" text,
  "og_title" text,
  "og_description" text,
  "og_image_url" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_page_settings_page_key_uq"
  ON "seo_page_settings" ("page_key");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rang_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "seo_page_settings" TO rang_app;
  END IF;
END $$;
