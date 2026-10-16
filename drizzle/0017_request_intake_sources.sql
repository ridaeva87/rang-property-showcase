ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "source" text;
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "contact_name" text;
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "contact_phone" text;
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "contact_email" text;
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "interest" text;

CREATE INDEX IF NOT EXISTS "requests_source_created_idx" ON "requests" ("source", "created_at");
