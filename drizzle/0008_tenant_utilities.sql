ALTER TABLE meters ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE meters ADD COLUMN IF NOT EXISTS is_monotonic boolean NOT NULL DEFAULT true;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tenant_user_id text REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS premise_id text REFERENCES premises(id) ON DELETE RESTRICT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS consumption numeric(16,4);

CREATE INDEX IF NOT EXISTS expenses_tenant_period_idx ON expenses(tenant_user_id,period_id);
CREATE INDEX IF NOT EXISTS expenses_premise_period_idx ON expenses(premise_id,period_id);

INSERT INTO meter_types(id,code,name,unit) VALUES
 ('meter-type-electricity','electricity','Электроэнергия','кВт⋅ч'),
 ('meter-type-water-cold','water_cold','Холодная вода','м³'),
 ('meter-type-water-hot','water_hot','Горячая вода','м³'),
 ('meter-type-heat','heat','Тепло','Гкал'),
 ('meter-type-gas','gas','Газ','м³')
ON CONFLICT(code) DO UPDATE SET name=excluded.name,unit=excluded.unit,updated_at=now();

INSERT INTO expense_categories(id,code,name) VALUES
 ('expense-electricity','electricity','Электроэнергия'),
 ('expense-water','water','Водоснабжение'),
 ('expense-heat','heat','Отопление'),
 ('expense-gas','gas','Газ'),
 ('expense-other-utilities','other_utilities','Прочие коммунальные расходы')
ON CONFLICT(code) DO UPDATE SET name=excluded.name,updated_at=now();

INSERT INTO permissions(id,code,name) VALUES
 ('perm-utilities-manage','utilities.manage','Управление счётчиками и коммунальными расходами')
ON CONFLICT(code) DO UPDATE SET name=excluded.name,updated_at=now();
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code='admin' AND p.code='utilities.manage'
ON CONFLICT DO NOTHING;
