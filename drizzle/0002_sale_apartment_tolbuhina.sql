INSERT INTO "property_objects" ("id", "slug", "name", "address", "description", "parking", "territory_features", "publication_status", "source_system", "external_id")
VALUES (
  'sale-object-tolbuhina-15-2',
  'zhiloy-dom-tolbuhina-15-2',
  'Жилой дом на Толбухина, 15, корпус 2',
  'г. Казань, ул. Толбухина, д. 15, корпус 2',
  'Кирпичный дом 2016 года постройки, сдан в эксплуатацию в 2017 году.',
  'Открытая парковка во дворе',
  '["Детская площадка", "Спортивная площадка", "Видеонаблюдение по периметру и в подъезде", "Умный домофон"]'::jsonb,
  'published', 'manual', 'rang-sale:tolbuhina-15-2'
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name", "address" = EXCLUDED."address",
  "description" = EXCLUDED."description", "parking" = EXCLUDED."parking",
  "territory_features" = EXCLUDED."territory_features",
  "publication_status" = EXCLUDED."publication_status", "updated_at" = now();
--> statement-breakpoint
INSERT INTO "premise_types" ("id", "code", "name")
VALUES ('apartment-2-room', 'apartment-2-room', '2-комнатная квартира')
ON CONFLICT ("id") DO UPDATE SET "code" = EXCLUDED."code", "name" = EXCLUDED."name", "updated_at" = now();
--> statement-breakpoint
INSERT INTO "premise_statuses" ("id", "code", "name", "is_available")
VALUES ('sale-available', 'sale-available', 'Доступно к продаже', true)
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "is_available" = true, "updated_at" = now();
--> statement-breakpoint
INSERT INTO "premises" (
  "id", "object_id", "type_id", "status_id", "slug", "title", "description",
  "area_sqm", "usable_area_sqm", "publication_status", "source_system", "external_id"
)
VALUES (
  'sale-apartment-tolbuhina-15-2', 'sale-object-tolbuhina-15-2', 'apartment-2-room', 'sale-available',
  '2-komnatnaya-kvartira-tolbuhina-15-2', '2-комнатная квартира',
  'Новая квартира с качественным евроремонтом, полностью готовая к проживанию. Изолированные комнаты, раздельный санузел, две лоджии и гардеробная. Квартира продаётся с мебелью и бытовой техникой непосредственно от собственника, без комиссии и обременений. Никто не прописан и не проживал.',
  59.2, 32.8, 'published', 'manual', 'rang-sale:apartment:tolbuhina-15-2'
)
ON CONFLICT ("id") DO UPDATE SET
  "object_id" = EXCLUDED."object_id", "type_id" = EXCLUDED."type_id", "status_id" = EXCLUDED."status_id",
  "title" = EXCLUDED."title", "description" = EXCLUDED."description", "area_sqm" = EXCLUDED."area_sqm",
  "usable_area_sqm" = EXCLUDED."usable_area_sqm", "publication_status" = EXCLUDED."publication_status",
  "updated_at" = now();
--> statement-breakpoint
INSERT INTO "property_offers" (
  "id", "premise_id", "type", "status", "sale_price", "purchase_terms", "publication_status"
)
VALUES (
  'sale-offer-apartment-tolbuhina-15-2', 'sale-apartment-tolbuhina-15-2', 'sale', 'Доступно к продаже',
  13600000, 'Свободная продажа от собственника. Без комиссии и обременений.', 'published'
)
ON CONFLICT ("premise_id", "type") DO UPDATE SET
  "status" = EXCLUDED."status", "sale_price" = EXCLUDED."sale_price",
  "purchase_terms" = EXCLUDED."purchase_terms", "publication_status" = EXCLUDED."publication_status",
  "updated_at" = now();
--> statement-breakpoint
INSERT INTO "premise_purposes" ("premise_id", "purpose")
VALUES ('sale-apartment-tolbuhina-15-2', 'Для проживания')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "premise_characteristics" ("id", "premise_id", "key", "label", "value_text", "value_number", "unit", "group_name", "sort_order") VALUES
('sale-t15-price-sqm', 'sale-apartment-tolbuhina-15-2', 'price-per-sqm', 'Цена за м²', NULL, 229730, '₽/м²', 'Основные характеристики', 1),
('sale-t15-rooms', 'sale-apartment-tolbuhina-15-2', 'rooms-count', 'Количество комнат', NULL, 2, NULL, 'Характеристики квартиры', 10),
('sale-t15-living-area', 'sale-apartment-tolbuhina-15-2', 'living-area', 'Жилая площадь', NULL, 32.8, 'м²', 'Характеристики квартиры', 11),
('sale-t15-kitchen-area', 'sale-apartment-tolbuhina-15-2', 'kitchen-area', 'Площадь кухни', NULL, 8.8, 'м²', 'Характеристики квартиры', 12),
('sale-t15-floor', 'sale-apartment-tolbuhina-15-2', 'floor', 'Этаж', '5/9', NULL, NULL, 'Характеристики квартиры', 13),
('sale-t15-ceiling', 'sale-apartment-tolbuhina-15-2', 'ceiling-height', 'Высота потолков', NULL, 2.7, 'м', 'Характеристики квартиры', 14),
('sale-t15-room-layout', 'sale-apartment-tolbuhina-15-2', 'room-layout', 'Комнаты', 'Изолированные', NULL, NULL, 'Характеристики квартиры', 15),
('sale-t15-bathroom', 'sale-apartment-tolbuhina-15-2', 'bathroom', 'Санузел', 'Раздельный', NULL, NULL, 'Характеристики квартиры', 16),
('sale-t15-windows', 'sale-apartment-tolbuhina-15-2', 'windows', 'Окна', 'Во двор и на улицу', NULL, NULL, 'Характеристики квартиры', 17),
('sale-t15-renovation', 'sale-apartment-tolbuhina-15-2', 'renovation', 'Ремонт', 'Евроремонт', NULL, NULL, 'Характеристики квартиры', 18),
('sale-t15-loggias', 'sale-apartment-tolbuhina-15-2', 'loggias', 'Лоджии', 'Две: 3,1 м² и 1,8 м²', NULL, NULL, 'Характеристики квартиры', 19),
('sale-t15-wardrobe', 'sale-apartment-tolbuhina-15-2', 'wardrobe', 'Гардеробная', 'Есть', NULL, NULL, 'Характеристики квартиры', 20),
('sale-t15-sale-method', 'sale-apartment-tolbuhina-15-2', 'sale-method', 'Способ продажи', 'Свободная продажа', NULL, NULL, 'Условия продажи', 30),
('sale-t15-owner', 'sale-apartment-tolbuhina-15-2', 'owner-sale', 'Продавец', 'Собственник', NULL, NULL, 'Условия продажи', 31),
('sale-t15-commission', 'sale-apartment-tolbuhina-15-2', 'commission', 'Комиссия', 'Без комиссии', NULL, NULL, 'Условия продажи', 32),
('sale-t15-encumbrances', 'sale-apartment-tolbuhina-15-2', 'encumbrances', 'Обременения', 'Нет', NULL, NULL, 'Условия продажи', 33),
('sale-t15-registration', 'sale-apartment-tolbuhina-15-2', 'registration', 'Регистрация и проживание', 'Никто не прописан и не проживал', NULL, NULL, 'Условия продажи', 34),
('sale-t15-room-hall', 'sale-apartment-tolbuhina-15-2', 'room-hall', 'Зал', NULL, 19.9, 'м²', 'Помещения', 40),
('sale-t15-room-bedroom', 'sale-apartment-tolbuhina-15-2', 'room-bedroom', 'Спальня', NULL, 12.9, 'м²', 'Помещения', 41),
('sale-t15-room-kitchen', 'sale-apartment-tolbuhina-15-2', 'room-kitchen', 'Кухня', NULL, 8.8, 'м²', 'Помещения', 42),
('sale-t15-room-loggia-1', 'sale-apartment-tolbuhina-15-2', 'room-loggia-1', 'Лоджия 1', NULL, 3.1, 'м²', 'Помещения', 43),
('sale-t15-room-loggia-2', 'sale-apartment-tolbuhina-15-2', 'room-loggia-2', 'Лоджия 2', NULL, 1.8, 'м²', 'Помещения', 44),
('sale-t15-house-type', 'sale-apartment-tolbuhina-15-2', 'house-type', 'Материал дома', 'Кирпичный', NULL, NULL, 'Характеристики дома', 50),
('sale-t15-house-year', 'sale-apartment-tolbuhina-15-2', 'house-year', 'Год постройки', '2016', NULL, NULL, 'Характеристики дома', 51),
('sale-t15-commissioned', 'sale-apartment-tolbuhina-15-2', 'commissioned', 'Сдан в эксплуатацию', '2017', NULL, NULL, 'Характеристики дома', 52),
('sale-t15-gas', 'sale-apartment-tolbuhina-15-2', 'gas', 'Газ', 'Есть', NULL, NULL, 'Характеристики дома', 53),
('sale-t15-lifts', 'sale-apartment-tolbuhina-15-2', 'lifts', 'Лифты', '1 пассажирский, 1 грузовой', NULL, NULL, 'Характеристики дома', 54),
('sale-t15-parking', 'sale-apartment-tolbuhina-15-2', 'parking', 'Парковка', 'Открытая во дворе', NULL, NULL, 'Характеристики дома', 55),
('sale-t15-playgrounds', 'sale-apartment-tolbuhina-15-2', 'playgrounds', 'Площадки', 'Детская и спортивная', NULL, NULL, 'Характеристики дома', 56),
('sale-t15-security', 'sale-apartment-tolbuhina-15-2', 'security', 'Безопасность', 'Видеонаблюдение по периметру и в подъезде', NULL, NULL, 'Характеристики дома', 57),
('sale-t15-intercom', 'sale-apartment-tolbuhina-15-2', 'intercom', 'Домофон', 'Умный домофон', NULL, NULL, 'Характеристики дома', 58),
('sale-t15-equipment', 'sale-apartment-tolbuhina-15-2', 'equipment', 'Мебель и техника', 'Квартира продаётся с мебелью и бытовой техникой', NULL, NULL, 'Мебель и техника', 60),
('sale-t15-kitchen-equipment', 'sale-apartment-tolbuhina-15-2', 'kitchen-equipment', 'Кухня', 'Кухонный гарнитур, газовая варочная поверхность, электрический духовой шкаф, вытяжка, холодильник, микроволновая печь, электрочайник, стол и стулья', NULL, NULL, 'Мебель и техника', 61),
('sale-t15-hall-equipment', 'sale-apartment-tolbuhina-15-2', 'hall-equipment', 'Зал', 'Шкаф, диван, Smart TV', NULL, NULL, 'Мебель и техника', 62),
('sale-t15-bedroom-equipment', 'sale-apartment-tolbuhina-15-2', 'bedroom-equipment', 'Спальня', 'Двуспальная кровать с матрасом, тумбы, комод', NULL, NULL, 'Мебель и техника', 63),
('sale-t15-bathroom-equipment', 'sale-apartment-tolbuhina-15-2', 'bathroom-equipment', 'Санузел', 'Душевая кабина, стиральная машина, шкаф', NULL, NULL, 'Мебель и техника', 64),
('sale-t15-hallway', 'sale-apartment-tolbuhina-15-2', 'hallway', 'Прихожая', 'Обустроена', NULL, NULL, 'Мебель и техника', 65),
('sale-t15-infrastructure', 'sale-apartment-tolbuhina-15-2', 'infrastructure', 'Рядом', 'Детский сад №259, гимназия №93, «Пятёрочка», парикмахерские, ателье, Почта России, пункты выдачи маркетплейсов', NULL, NULL, 'Инфраструктура', 70),
('sale-t15-transport', 'sale-apartment-tolbuhina-15-2', 'transport', 'Транспорт', 'Остановка «улица Гвардейская»: автобус, троллейбус, трамвай', NULL, NULL, 'Инфраструктура', 71)
ON CONFLICT ("premise_id", "key") DO UPDATE SET
  "label" = EXCLUDED."label", "value_text" = EXCLUDED."value_text", "value_number" = EXCLUDED."value_number",
  "unit" = EXCLUDED."unit", "group_name" = EXCLUDED."group_name", "sort_order" = EXCLUDED."sort_order",
  "updated_at" = now();
