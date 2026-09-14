ALTER TABLE expenses ALTER COLUMN organization_id DROP NOT NULL;

-- Restore the two counters that were unintentionally merged during the production test.
INSERT INTO meters(id,premise_id,type_id,name,serial_number,is_active,is_monotonic,created_at,updated_at)
SELECT 'recovered-water-property-001',premise_id,'meter-type-water-cold','Водоснабжение','TEST-002',true,true,now(),now()
FROM meters WHERE id='bafa21eb-00f2-4b96-a348-62a49e791708'
ON CONFLICT(id) DO NOTHING;
UPDATE meters SET type_id='meter-type-electricity',name='Электроэнергия',serial_number='TEST-001',updated_at=now()
WHERE id='bafa21eb-00f2-4b96-a348-62a49e791708';
