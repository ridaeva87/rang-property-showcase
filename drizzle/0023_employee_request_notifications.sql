ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "receive_request_notifications" boolean DEFAULT true NOT NULL;

UPDATE "employees" AS e
SET "receive_request_notifications" = false,
    "updated_at" = now()
FROM "users" AS u
WHERE e."user_id" = u."id"
  AND lower(btrim(u."display_name")) IN ('тестовый', 'тестовый 2');
