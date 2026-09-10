ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activated_at" timestamp with time zone;
UPDATE "users" SET "activated_at" = COALESCE("password_changed_at", "created_at") WHERE "password_hash" IS NOT NULL AND "activated_at" IS NULL;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "recipient_user_id" text REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
CREATE INDEX IF NOT EXISTS "documents_recipient_idx" ON "documents" ("recipient_user_id");
