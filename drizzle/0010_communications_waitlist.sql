ALTER TABLE announcements ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience jsonb NOT NULL DEFAULT '{"scope":"all"}'::jsonb;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS channels jsonb NOT NULL DEFAULT '["in_app"]'::jsonb;

CREATE TABLE IF NOT EXISTS user_channel_consents (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel delivery_channel NOT NULL,
  status text NOT NULL CHECK (status IN ('granted','denied','revoked')),
  source text NOT NULL,
  legal_text_version text,
  consented_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel)
);

CREATE TABLE IF NOT EXISTS delivery_logs (
  id text PRIMARY KEY,
  announcement_id text REFERENCES announcements(id) ON DELETE SET NULL,
  recipient_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel delivery_channel NOT NULL,
  status text NOT NULL CHECK (status IN ('prepared','sent','delivered','error','skipped')),
  reason text,
  initiated_by_user_id text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS delivery_logs_filter_idx ON delivery_logs(created_at, channel, status);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id text PRIMARY KEY,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  premise_id text REFERENCES premises(id) ON DELETE SET NULL,
  premise_type_id text REFERENCES premise_types(id) ON DELETE SET NULL,
  object_id text REFERENCES property_objects(id) ON DELETE SET NULL,
  area_min numeric(12,2),
  area_max numeric(12,2),
  price_min numeric(14,2),
  price_max numeric(14,2),
  status text NOT NULL DEFAULT 'active',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR contact_email IS NOT NULL OR contact_phone IS NOT NULL),
  CHECK (area_min IS NULL OR area_max IS NULL OR area_min <= area_max),
  CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)
);
CREATE INDEX IF NOT EXISTS waitlist_matching_idx ON waitlist_entries(status, premise_type_id, object_id);

INSERT INTO permissions(id,code,name) VALUES
 ('perm-notifications-manage','notifications.manage','Уведомления'),
 ('perm-delivery-logs-view','delivery_logs.view','Журнал отправок'),
 ('perm-waitlist-manage','waitlist.manage','Лист ожидания')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='admin' AND p.code IN ('notifications.manage','delivery_logs.view','waitlist.manage')
ON CONFLICT DO NOTHING;
