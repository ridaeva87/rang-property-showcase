ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
CREATE UNIQUE INDEX IF NOT EXISTS "requests_idempotency_key_uq" ON "requests" ("idempotency_key");
