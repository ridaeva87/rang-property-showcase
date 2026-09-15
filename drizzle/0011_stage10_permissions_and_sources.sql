ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'waitlist';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rang_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON user_channel_consents, delivery_logs, waitlist_entries TO rang_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON announcements, announcement_recipients, notifications TO rang_app;
  END IF;
END $$;
