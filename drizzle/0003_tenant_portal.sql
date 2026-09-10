ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_changed_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "user_sessions_user_idx" ON "user_sessions" ("user_id", "expires_at");

CREATE TABLE IF NOT EXISTS "user_access_tokens" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "purpose" text NOT NULL CHECK ("purpose" IN ('activation', 'password_reset')),
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "user_access_tokens_user_idx" ON "user_access_tokens" ("user_id", "purpose", "expires_at");

CREATE TABLE IF NOT EXISTS "tenant_premises" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "premise_id" text NOT NULL REFERENCES "premises"("id") ON DELETE RESTRICT,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "premise_id")
);
CREATE INDEX IF NOT EXISTS "tenant_premises_premise_idx" ON "tenant_premises" ("premise_id");

INSERT INTO "roles" ("id", "code", "name") VALUES
  ('role-tenant', 'tenant', 'Арендатор'),
  ('role-admin', 'admin', 'Администратор')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "updated_at" = now();

INSERT INTO "request_categories" ("id", "code", "name") VALUES
  ('req-cat-repair', 'repair', 'Ремонт'),
  ('req-cat-electricity', 'electricity', 'Электрика'),
  ('req-cat-plumbing', 'plumbing', 'Сантехника'),
  ('req-cat-refit', 'refit', 'Переоборудование'),
  ('req-cat-access', 'access', 'Доступ и пропуска'),
  ('req-cat-loading', 'loading', 'Погрузка/разгрузка'),
  ('req-cat-accounting', 'accounting', 'Бухгалтерия'),
  ('req-cat-legal', 'legal', 'Юридические вопросы'),
  ('req-cat-documents', 'documents', 'Документы'),
  ('req-cat-other', 'other', 'Другое')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "updated_at" = now();

INSERT INTO "request_statuses" ("id", "code", "name", "is_closed") VALUES
  ('req-status-accepted', 'accepted', 'Принято', false),
  ('req-status-in-progress', 'in_progress', 'В работе', false),
  ('req-status-completed', 'completed', 'Выполнено', true)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "is_closed" = EXCLUDED."is_closed", "updated_at" = now();

INSERT INTO "document_types" ("id", "code", "name") VALUES
  ('doc-type-contract', 'contract', 'Договор'),
  ('doc-type-invoice', 'invoice', 'Счёт'),
  ('doc-type-act', 'act', 'Акт'),
  ('doc-type-notice', 'notice', 'Уведомление'),
  ('doc-type-other', 'other', 'Другой документ')
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "updated_at" = now();
