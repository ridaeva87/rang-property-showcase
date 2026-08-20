# RANG — backend и единая модель данных

Дата: 20 августа 2026 года  
Этап: 5  
Исходная production-точка: `main` / `a8415b6`

## 1. Архитектурное решение

Выбрана PostgreSQL 16+ на том же VPS Timeweb Cloud (отдельная БД и отдельный пользователь приложения). Причины: транзакции и внешние ключи для связанных договоров, помещений, заявок и показаний; зрелые backup/restore; отсутствие привязки к BaaS; поддержка JSONB только для неструктурных метаданных; совместимость с Ubuntu и будущей 1С-интеграцией.

Доступ к данным реализован через Drizzle ORM и драйвер `pg`. Drizzle сохраняет типизацию TypeScript, создаёт проверяемые SQL-миграции и не скрывает PostgreSQL. Zod валидирует входные данные на server boundary.

```text
Browser / SSR loader
  → TanStack Start server function (validation + safe error)
  → catalog service (business use case)
  → repository (queries and mapping)
  → Drizzle / node-postgres pool
  → PostgreSQL
```

React-компоненты не импортируют database client. `DATABASE_URL` читается только серверным модулем. В будущем middleware авторизации устанавливает identity, а service/repository применяют RBAC и tenant scope; структура `users`, `employees`, `roles`, `permissions`, `user_roles` и `role_permissions` к этому готова. Пароль допускается только как `password_hash`; на Этапе 5 пользователи и фиктивные пароли не создаются.

## 2. Backend-слой

- `src/server/db/schema.ts` — единая схема;
- `src/server/db/client.ts` — ленивый ограниченный connection pool;
- `src/server/catalog/contracts.ts` — DTO и серверная валидация;
- `src/server/catalog/catalog.repository.ts` — единственный SQL/data mapping слоя каталога;
- `src/server/catalog/catalog.service.ts` — use cases;
- `src/server/catalog/catalog.functions.ts` — безопасные TanStack server functions;
- `src/server/db/public-catalog-seed.ts` — идемпотентная контролируемая миграция текущих данных;
- `scripts/` — migrate, seed и connection check.

Публичный слой предоставляет только необходимые операции: список/карточка помещения, список/карточка объекта, список услуг и выбор `offerType=rent|sale`. Запись заявок, auth/admin, документы, показания, уведомления и реклама не опубликованы как endpoints до появления бизнес-логики и прав доступа.

## 3. Схема данных

### Недвижимость и каталог

`property_objects`, `premise_types`, `premise_statuses`, `premises`, `premise_characteristics`, `premise_purposes`, `property_offers`, `media_assets`, `object_media`, `premise_media`, `additional_services`, `service_categories`.

Объект содержит общие адресные/территориальные данные; помещение ссылается на объект. Тип и статус нормализованы. Аренда/продажа находятся в `property_offers`, поэтому цена продажи не смешивается со ставкой аренды. Произвольные Excel-характеристики становятся строками `premise_characteristics`, а не новыми колонками под конкретный файл.

### Арендаторы, сотрудники и доступ

`organizations`, `users`, `organization_users`, `employees`, `roles`, `permissions`, `user_roles`, `role_permissions`.

Организация, пользователь и сотрудник RANG — отдельные понятия. Один пользователь может быть связан с организацией; сотрудник всегда ссылается на user identity, но не становится арендатором.

### Договоры

`lease_contracts`, `lease_premises`. Связь: организация → договор → одно или несколько помещений; период конкретного помещения хранится в join-таблице.

### Заявки

`request_categories`, `request_statuses`, `requests`, `request_comments`, `request_status_history`. Внешний и внутренний комментарий разделены enum `request_visibility`; ответственный — `employee`.

### Документы и коммуникации

`document_types`, `documents`, `announcements`, `announcement_recipients`, `notifications`. Документ ссылается на `media_assets` и опционально на организацию, договор, помещение или объект. Бинарные файлы в PostgreSQL не хранятся.

### Интерес, реклама, приборы и экономика

`favorites`, `property_interests`, `ad_placements`, `ad_leads`, `meter_types`, `meters`, `meter_readings`, `expense_categories`, `accounting_periods`, `accruals`, `expenses`.

Локальное избранное продолжает работать. Таблица `favorites` предназначена для будущего аккаунта и последующей синхронизации localStorage → user; синхронизация не реализована.

### Системные данные и интеграции

`audit_logs`, `integration_mappings`. Основные сущности имеют `created_at`/`updated_at`; audit хранит actor/action/before/after. `integration_mappings` отделяет внутренние ID от ID Excel/1С и поддерживает idempotent reconciliation.

Всего: 45 таблиц, 11 enum-типов. Подробные FK, уникальные ограничения и индексы являются исполняемой документацией в `schema.ts` и `drizzle/0000_narrow_bulldozer.sql`.

## 4. Миграции и текущие данные

Миграция `0000_narrow_bulldozer.sql` создаёт всю схему. Запуск:

```bash
DATABASE_URL=... npm run db:migrate
DATABASE_URL=... npm run db:seed:catalog
DATABASE_URL=... npm run db:check
```

Порядок безопасного применения: backup → миграция на staging/test → connection/schema test → идемпотентный seed → сверка 4 объектов, 7 помещений и 8 услуг → только затем запуск приложения. Миграции нельзя редактировать после применения; каждое изменение получает новый SQL-файл.

Seed переносит текущие IDs/slugs, связи, статусы, площади, назначение, подтверждённую ставку и характеристики склада №8. Он использует `ON CONFLICT DO NOTHING`, поэтому повторный запуск не дублирует строки. Статический `src/data/rang.ts` пока не удалён: production-БД и её backup ещё не были разрешены, а frontend не должен переключаться на несуществующую production-БД. До deployment это migration source/safety fallback, а не параллельно редактируемый новый источник.

Переключение публичного frontend выполняется одной контролируемой операцией после создания production-БД: backup текущего commit/build → migration → seed → row/checksum reconciliation → server-function smoke test → перевод route loaders → full browser test. После подтверждения БД становится единственным редактируемым источником бизнес-данных; статические массивы архивируются/удаляются отдельным commit. В текущей ветке UI намеренно не переключён, поэтому production остаётся работоспособным без БД.

## 5. Excel, медиа, Object Storage и 1С

Excel импортируется будущим адаптером по заголовкам и mapping profile, а не по номерам столбцов: вкладка → `property_object`; строка → `premise`; произвольные поля → типизированное сопоставление или `premise_characteristics`; исходный внешний ключ → `integration_mappings(system=excel)`. Перед импортом нужны dry-run, отчёт конфликтов и транзакция. Массовый импорт не выполнен.

`media_assets` хранит kind, storage key, optional URL, MIME, размер, dimensions/duration, checksum, metadata и дату загрузки. `object_media`/`premise_media` задают связь и порядок. Локальный путь и будущий Object Storage используют одинаковый `storage_key`; подключение storage не выполнено.

1С подключается через отдельный versioned adapter. `source_system`, `external_id` и `integration_mappings` позволяют сопоставлять арендаторов, договоры, помещения, начисления и документы без зависимости от конкретной конфигурации 1С. Нужны спецификация, ownership полей, idempotency keys и правила конфликтов; интеграция не выполнена.

## 6. Безопасность

- Zod ограничивает типы, длины, slug и диапазоны на server boundary;
- SQL параметризуется Drizzle;
- клиент получает нейтральную ошибку, деталь остаётся в server log;
- секреты отсутствуют в frontend и Git; `.env.example` содержит только шаблоны;
- `DATABASE_URL` выдаётся отдельному PostgreSQL role с минимальными правами;
- миграционный role и runtime role рекомендуется разделить;
- Nginx не публикует PostgreSQL; порт 5432 слушает localhost/private interface;
- будущие auth endpoints требуют secure/httpOnly/sameSite cookies, CSRF, rate limits, audit и проверку permission + organization scope;
- персональные данные не логируются целиком; IP допускается только как hash с ротацией salt;
- реальные пользователи и пароли не создавались.

## 7. Backup и восстановление

Минимальная стратегия для VPS:

- ежедневно: `pg_dump --format=custom --no-owner` перед ночным окном;
- перед каждой migration/deploy: отдельный pre-deploy dump;
- хранение: зашифрованная директория вне web-root на VPS плюс вторая копия в отдельном хранилище Timeweb после отдельного согласования;
- retention: 7 daily, 5 weekly, 6 monthly; pre-deploy — минимум до двух успешных релизов;
- checksum SHA-256 и журнал завершения;
- ежемесячный restore drill в отдельную test DB командой `pg_restore --clean --if-exists --no-owner`;
- RPO 24 часа до настройки WAL/PITR; RTO ориентировочно 2 часа, уточняется после замера объёма.

Rollback schema выполняется прежде всего восстановлением pre-deploy dump и возвратом предыдущего commit/build. Автоматические down-migrations для destructive изменений не считаются достаточной защитой.

## 8. Production deployment — только после подтверждения

1. Проверить `a8415b6`, снять dump/архив текущего состояния и записать checksum.
2. Merge подтверждённой ветки в `main`, push GitHub; на VPS — fast-forward only.
3. Установить PostgreSQL на VPS или согласованную инфраструктуру Timeweb; создать DB, migration role и restricted app role; закрыть внешний порт.
4. Записать `DATABASE_URL` только в server `.env` с правами `600`; не показывать значение в терминальном отчёте.
5. Установить зависимости без создания несогласованного lock-файла.
6. Выполнить `db:check`, миграцию, seed и сверку counts в test/staging, затем в production.
7. Сделать production build, проверить `node-server` и отсутствие Cloudflare artifacts.
8. До переключения маршрутов выполнить server layer smoke test. Перевод frontend на БД — только при полном совпадении данных и наличии media strategy.
9. `pm2 restart rang --update-env`, GET smoke всех маршрутов, DB check, Console/Network и responsive smoke.
10. `pm2 save`; наблюдать error log и DB connections.

Rollback: остановить новый процесс, вернуть предыдущий commit/build, восстановить предыдущий env, при изменении данных восстановить pre-deploy dump в отдельную DB и атомарно вернуть connection string. Nginx/SSL/DNS не меняются.

## 9. Намеренные ограничения Этапа 5

Не реализованы auth, личный кабинет, admin, запись заявок, коммуникации, 1С, Excel import, Object Storage, uploads, meter UI, расчёт экономии, реклама, аналитика и AI. Production-БД не создана, production migration/deploy не выполнялись. Публичный UI ещё работает со статическими данными до отдельного безопасного cutover.
