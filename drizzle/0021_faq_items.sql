CREATE TABLE IF NOT EXISTS "faq_items" (
  "id" text PRIMARY KEY,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "category" text NOT NULL,
  "display_order" integer NOT NULL DEFAULT 0,
  "publication_status" "publication_status" NOT NULL DEFAULT 'draft',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "faq_items_publication_order_idx"
  ON "faq_items" ("publication_status", "display_order");
CREATE INDEX IF NOT EXISTS "faq_items_category_order_idx"
  ON "faq_items" ("category", "display_order");

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rang_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "faq_items" TO rang_app;
  END IF;
END $$;
