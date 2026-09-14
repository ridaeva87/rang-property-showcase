ALTER TABLE property_interests ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE property_interests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE property_interests ADD COLUMN IF NOT EXISTS assignee_employee_id text REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE property_interests ADD COLUMN IF NOT EXISTS viewing_at timestamptz;

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'announcement';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS audience_group_id text REFERENCES tenant_groups(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS sent_at timestamptz;

ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS tenant_user_id text REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS media_id text REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS link_url text;

CREATE INDEX IF NOT EXISTS property_interests_assignee_idx ON property_interests(assignee_employee_id);
CREATE INDEX IF NOT EXISTS announcements_kind_status_idx ON announcements(kind,status);
CREATE INDEX IF NOT EXISTS ad_placements_tenant_idx ON ad_placements(tenant_user_id);
