ALTER TABLE "ad_leads" ADD COLUMN IF NOT EXISTS "message" text;
ALTER TABLE "ad_leads" ADD COLUMN IF NOT EXISTS "cta" text NOT NULL DEFAULT 'contact_form';
ALTER TABLE "ad_leads" ADD COLUMN IF NOT EXISTS "inquiry_type" text NOT NULL DEFAULT 'internal_form';
ALTER TABLE "ad_leads" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'new';
ALTER TABLE "ad_leads" ADD COLUMN IF NOT EXISTS "assignee_employee_id" text REFERENCES "employees"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "ad_leads_assignee_idx" ON "ad_leads" ("assignee_employee_id");

UPDATE "ad_leads" lead
SET "message" = (
  SELECT NULLIF(event_row."metadata"->>'message', '') AS "message"
  FROM "ad_events" event_row
  WHERE event_row."placement_id" = lead."placement_id"
    AND event_row."event_type" = 'internal_lead'
  ORDER BY abs(extract(epoch FROM (event_row."created_at" - lead."created_at")))
  LIMIT 1
)
WHERE lead."message" IS NULL;

UPDATE "ad_leads"
SET "source" = 'Реклама арендатора / RANG'
WHERE "source" = 'rangpro.ru/businesses';
