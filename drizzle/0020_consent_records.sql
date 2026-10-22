CREATE TABLE IF NOT EXISTS "personal_data_consent_records" (
  "id" text PRIMARY KEY,
  "request_id" text REFERENCES "requests"("id") ON DELETE CASCADE,
  "ad_lead_id" text REFERENCES "ad_leads"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "legal_text_version" text NOT NULL,
  "consented_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "personal_data_consent_records_subject_check"
    CHECK (num_nonnulls("request_id", "ad_lead_id") = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS "personal_data_consent_records_request_uq"
  ON "personal_data_consent_records" ("request_id") WHERE "request_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "personal_data_consent_records_ad_lead_uq"
  ON "personal_data_consent_records" ("ad_lead_id") WHERE "ad_lead_id" IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rang_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "personal_data_consent_records" TO rang_app;
  END IF;
END $$;
