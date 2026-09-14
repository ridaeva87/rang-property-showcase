CREATE TABLE IF NOT EXISTS tenant_groups (
  id text PRIMARY KEY, name text NOT NULL UNIQUE, description text,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS tenant_group_members (
  group_id text NOT NULL REFERENCES tenant_groups(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (group_id,user_id)
);
CREATE TABLE IF NOT EXISTS tenant_interactions (
  id text PRIMARY KEY, tenant_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  kind text NOT NULL, summary text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS tenant_interactions_tenant_idx ON tenant_interactions(tenant_user_id,created_at);
INSERT INTO tenant_groups(id,name,description) VALUES ('tenant-group-default','Арендаторы','Основная группа арендаторов') ON CONFLICT(name) DO NOTHING;

INSERT INTO permissions(id,code,name) VALUES
 ('perm-admin-access','admin.access','Доступ в административную систему'),
 ('perm-premises-manage','premises.manage','Управление помещениями'),
 ('perm-tenants-manage','tenants.manage','Управление арендаторами'),
 ('perm-leads-manage','leads.manage','Потенциальные клиенты'),
 ('perm-mailings-manage','mailings.manage','Рассылки'),
 ('perm-announcements-manage','announcements.manage','Объявления'),
 ('perm-documents-manage','documents.manage','Документы'),
 ('perm-services-manage','services.manage','Дополнительные услуги'),
 ('perm-ads-manage','ads.manage','Реклама арендаторов'),
 ('perm-support-manage','support.manage','Поддержка'),
 ('perm-employees-manage','employees.manage','Управление сотрудниками'),
 ('perm-statistics-view','statistics.view','Статистика')
ON CONFLICT(code) DO UPDATE SET name=excluded.name,updated_at=now();

INSERT INTO roles(id,code,name) VALUES
 ('role-rental-manager','rental_manager','Менеджер по аренде'),
 ('role-accountant','accountant','Бухгалтер'),
 ('role-lawyer','lawyer','Юрист'),
 ('role-technician','technician','Технический специалист')
ON CONFLICT(code) DO UPDATE SET name=excluded.name,updated_at=now();

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='admin'
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code=ANY(ARRAY['admin.access','premises.manage','leads.manage','requests.view','requests.manage','support.manage'])
WHERE r.code='rental_manager' ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code=ANY(ARRAY['admin.access','requests.view','requests.manage','documents.manage'])
WHERE r.code IN ('accountant','lawyer') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code=ANY(ARRAY['admin.access','requests.view','requests.manage','support.manage'])
WHERE r.code='technician' ON CONFLICT DO NOTHING;
