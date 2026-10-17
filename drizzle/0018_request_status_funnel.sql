ALTER TABLE "request_statuses"
  ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

INSERT INTO "request_statuses" ("id", "code", "name", "is_closed", "display_order", "is_active") VALUES
  ('req-status-new', 'new', 'Новая', false, 10, true),
  ('req-status-in-progress', 'in_progress', 'В работе', false, 20, true),
  ('req-status-waiting-customer', 'waiting_customer', 'Ожидает клиента', false, 30, true),
  ('req-status-qualified', 'qualified', 'Квалифицирована', false, 40, true),
  ('req-status-closed-won', 'closed_won', 'Закрыта успешно', true, 50, true),
  ('req-status-closed-lost', 'closed_lost', 'Закрыта без результата', true, 60, true)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "is_closed" = EXCLUDED."is_closed",
  "display_order" = EXCLUDED."display_order",
  "is_active" = true,
  "updated_at" = now();

UPDATE "request_statuses"
SET "is_active" = false
WHERE "code" IN ('accepted', 'completed');
