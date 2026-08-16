# PROJECT ANALYSIS — RANG

Дата завершения аудита: 14 августа 2026 года  
Репозиторий: `ridaeva87/rang-property-showcase`  
Исходная ветка: `main`  
Проверенный commit: `582635a` (`Update plan`)  
Production: https://rangpro.ru/  
Этап: 0–0.1 — анализ проекта и синхронизация deployment-конфигурации

## 1. Итог

RANG сейчас является демонстрационным полноэкранным сайтом-витриной на React и TanStack Start. Приложение поддерживает SSR и собирается Vite/Nitro, но прикладного backend, API, базы данных, авторизации, административной системы и постоянного хранения данных в проекте нет. Единственный публичный маршрут — `/`; остальные пункты навигации являются якорями секций главной страницы.

Каталог, объекты, FAQ, услуги, арендаторы и остальные сведения хранятся статически в TypeScript. Фильтр, формы, карточки, личный кабинет, юридические документы, видео, заявки и AI-помощник работают только как демонстрационные интерфейсы: они меняют локальное React-состояние или показывают toast, но не отправляют и не сохраняют данные.

Исходники полностью объясняют наблюдаемое поведение production. Хэши клиентских ресурсов локальной сборки совпали с production (`index-BvwQ1TT8.js`, `routes-mQ1Kd110.js`, `styles-D4oLO9ml.css` и изображения), что является сильным подтверждением соответствия предоставленного `main` развёрнутому сайту.

На Этапе 0.1 deployment-конфигурация синхронизирована с фактической production-архитектурой Timeweb Cloud: Nitro preset явно закреплён как `node-server`, а в `package.json` добавлена команда запуска уже собранного приложения. Cloudflare больше не является production target репозитория.

Целевая и фактически используемая схема:

```text
Internet → Nginx → 127.0.0.1:3000 → Node.js 22.23.2 / TanStack Start / Nitro → PM2 (rang)
```

Production размещён на VPS Timeweb Cloud под Ubuntu 24.04. HTTPS завершается в Nginx через Certbot / Let's Encrypt; PM2 восстанавливает процесс после перезагрузки VPS.

## 2. Методика и выполненные проверки

Проверены:

- Git-история, ветки, remote и commit `main`;
- `package.json`, `bun.lock`, `bunfig.toml`;
- Vite/Lovable, TypeScript, ESLint, shadcn и router-конфигурации;
- все прикладные routes, RANG-компоненты, данные, стили и server entry;
- поиск API, server functions, env, БД, auth, storage, uploads, интеграций и аналитики;
- production DOM/метаданные/формы/ассеты;
- неизменённая production-сборка;
- ESLint без автоисправлений.

Ничего из найденных проблем не исправлялось. Функциональный и визуальный код не изменялся.

## 3. Архитектура

### 3.1 Общая схема

```text
Browser
  -> TanStack Router (/)
  -> React-компоненты главной страницы
  -> статические TypeScript-массивы + локальные JPG
  -> локальный React state / Sonner toast

SSR request
  -> Nitro runtime
  -> src/server.ts
  -> @tanstack/react-start/server-entry
  -> TanStack Start SSR
```

Приложение монолитно на уровне одного frontend/SSR-проекта. Отдельного backend-сервиса и слоя доступа к данным нет.

### 3.2 Серверный слой

`src/server.ts` — обёртка server entry. Она:

- импортирует стандартный `@tanstack/react-start/server-entry`;
- проксирует `fetch(request, env, ctx)`;
- перехватывает катастрофические SSR-ошибки;
- преобразует некоторые JSON 500-ответы H3 в HTML-страницу ошибки.

`src/start.ts` регистрирует:

- middleware обработки ошибок;
- стандартную CSRF-защиту TanStack Start для будущих `serverFn`.

Это инфраструктурный SSR-слой, а не бизнес-backend. Server functions и API-маршруты отсутствуют.

### 3.3 Роутер и data client

`src/router.tsx` создаёт TanStack Router и новый `QueryClient` на экземпляр роутера. React Query подключён в root layout, но запросов и query hooks в прикладном коде нет.

`src/routeTree.gen.ts` содержит только root и `/`. SSR включён (`ssr: true`).

## 4. Фактический стек и версии

### 4.1 Основной стек

| Область | Технология | Диапазон в `package.json` | Зафиксировано в `bun.lock` |
|---|---|---:|---:|
| Runtime UI | React | `^19.2.0` | `19.2.8` |
| DOM | React DOM | `^19.2.0` | `19.2.8` |
| Full-stack framework | TanStack Start | `^1.168.32` | `1.168.32` |
| Routing | TanStack React Router | `^1.170.18` | `1.170.18` |
| Server state | TanStack React Query | `^5.101.1` | `5.101.4` |
| Build | Vite | `^8.1.5` | `8.1.5` |
| Server build/runtime | Nitro | exact `3.0.260603-beta` | `3.0.260603-beta` |
| Language | TypeScript | `^5.8.3` | `5.9.3` |
| CSS | Tailwind CSS | `^4.2.1` | `4.3.3` |
| Vite/TanStack preset | Lovable config | exact `2.12.0` | `2.12.0` |
| Forms available | React Hook Form | `^7.71.2` | `7.83.0` |
| Validation available | Zod | `^3.24.2` | `3.25.76` |
| Notifications | Sonner | `^2.0.7` | `2.0.7` |
| Icons | Lucide React | `^0.575.0` | `0.575.0` |
| UI primitives | Radix UI packages | разные | зафиксированы в lock |
| UI scaffolding | shadcn/ui style `new-york` | config | локальные компоненты |

Источником воспроизводимых версий является `bun.lock`. Установка через другой package manager по диапазонам может получить более новые patch/minor-версии; для production следует использовать Bun и lock-файл проекта.

### 4.2 Инструменты

- package manager: Bun (`bun.lock`, `bunfig.toml`);
- TypeScript strict mode, target ES2022, bundler module resolution;
- ESLint 9 + typescript-eslint + React Hooks + React Refresh + Prettier;
- alias `@/* -> ./src/*`;
- Tailwind v4 через CSS-first configuration;
- Google Fonts: Manrope и Onest.

### 4.3 Скрипты

- `dev`: `vite dev`;
- `build`: `vite build`;
- `build:dev`: `vite build --mode development`;
- `start`: `node .output/server/index.mjs`;
- `preview`: `vite preview`;
- `lint`: `eslint .`;
- `format`: `prettier --write .`.

Отдельных `test`, `typecheck`, migration, seed или database scripts нет.

## 5. Структура директорий

```text
.
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/                 # 9 JPG для hero, типов и объектов
│   ├── components/
│   │   ├── rang/               # прикладной UI сайта
│   │   └── ui/                 # библиотека shadcn/Radix компонентов
│   ├── data/rang.ts            # NAV, объекты, помещения, типы, FAQ
│   ├── hooks/use-mobile.tsx     # breakpoint < 768 px
│   ├── lib/                     # utils и обработка ошибок Lovable/SSR
│   ├── routes/
│   │   ├── __root.tsx          # HTML shell, meta, boundaries
│   │   └── index.tsx           # единственная страница /
│   ├── routeTree.gen.ts         # автогенерация TanStack Router
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── AGENTS.md
├── README.md
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 6. Страницы и маршруты

### 6.1 Реальные маршруты

- `/` — единственный прикладной маршрут;
- `notFoundComponent` — общая англоязычная 404-страница;
- `errorComponent` — общая англоязычная error boundary.

Отдельных маршрутов каталога, помещения, объекта, арендатора, личного кабинета, admin или юридических документов нет.

### 6.2 Hash-навигация

`NAV` в `src/data/rang.ts` ведёт к:

- `#free`, `#rent`, `#sale`, `#services`, `#tenants`, `#about`, `#contacts`.

Дополнительно используются `#top`, `#search` и `#cta`. Это секции `/`, а не маршруты TanStack Router.

## 7. Главная страница и компоненты

`src/routes/index.tsx` собирает страницу в следующем порядке:

1. `Header`;
2. `Hero`;
3. `FreePremises`;
4. `ComingSoon`;
5. `PremiseTypes`;
6. `Objects`;
7. `RentSection`;
8. `SaleSection`;
9. `Services`;
10. `Videos`;
11. `Tenants`;
12. `About`;
13. `HowTo`;
14. `Faq`;
15. `CtaForm`;
16. `Contacts`;
17. `Footer`;
18. `AiAssistant`.

`Sections.tsx` содержит почти все секции, их локальные данные и демонстрационные обработчики. Это удобно для прототипа, но файл уже объединяет несколько разных доменных областей.

`src/components/ui/` содержит большую библиотеку готовых UI-примитивов, большинство из которых текущая страница не использует. Они могут быть повторно использованы, но наличие файла не означает наличие соответствующей бизнес-функции.

## 8. Данные каталога

### 8.1 Где хранятся данные

В `src/data/rang.ts` статически объявлены:

- `NAV` — 7 пунктов;
- `OBJECTS` — 4 объекта;
- `FREE_PREMISES` — 4 помещения;
- `SOON_PREMISES` — 3 помещения;
- `PREMISE_TYPES` — 4 типа;
- `FAQ` — 8 вопросов.

В `Sections.tsx` статически объявлены:

- варианты аренды;
- услуги;
- видео;
- демонстрационные арендаторы;
- этапы аренды.

Данные не имеют стабильных ID, slug, числовой нормализации площади/цены, timestamps, publication status, SEO-полей и связей по foreign key. Например, площадь и цена хранятся уже отформатированными строками (`"133 м²"`, `"от 900 ₽/м²"`).

### 8.2 Карточки помещений

Карточка свободного помещения показывает изображение, статус, название, объект, тип, площадь, цену, features и кнопку «Подробнее». Кнопка только вызывает toast.

Карточка будущего помещения показывает дату/статус и CTA заявки, который также вызывает toast.

Полной карточки помещения, галереи, характеристик, планировки, карты, availability calendar, документов и связанного SEO URL нет.

### 8.3 Фильтр

Hero содержит UI-фильтр по типу, площади от/до и объекту. На submit выполняются `preventDefault()` и toast. Значения полей не контролируются, не валидируются и не применяются к `FREE_PREMISES`.

## 9. Формы, CTA и бизнес-логика

### 9.1 Формы

1. Hero filter — только toast.
2. `CtaForm` — после submit ставит локальный `sent=true` и показывает сообщение; данные не читаются и не отправляются.
3. AI input — сообщение сохраняется только в локальном state текущего компонента.

Поля основной заявки:

- не имеют `name`;
- не имеют `required`;
- не имеют схемы Zod/React Hook Form;
- не имеют нормализации телефона;
- не имеют согласия на обработку ПДн;
- не имеют server endpoint;
- не сохраняются после reload.

### 9.2 CTA

Рабочими являются только якорные переходы и раскрытие FAQ/меню/чата. Остальные CTA показывают заранее заданные toast-сообщения, включая:

- личный кабинет;
- весь каталог и карточки;
- заявки на будущие помещения/услуги/размещение бизнеса;
- продажу;
- страницы объектов, арендаторов и компании;
- видео;
- юридические документы;
- передачу вопроса сотруднику.

### 9.3 AI-помощник

`AiAssistant.tsx` — детерминированный keyword-based mock:

- локальный массив сообщений;
- пять быстрых подсказок;
- ответы функцией `reply()` по `includes()` и регулярному выражению;
- искусственная задержка 450 ms;
- никакого AI API, RAG, базы знаний, сохранения истории или handoff.

## 10. Backend, API и хранение

### 10.1 Отсутствует

- прикладной backend;
- API routes;
- TanStack server functions;
- database client/ORM;
- schema/migrations/seeds;
- база данных;
- Redis/cache/queue;
- постоянное хранение заявок;
- файловое или объектное хранилище;
- загрузка файлов;
- email/SMS/Telegram;
- webhooks;
- интеграция 1С;
- CMS.

### 10.2 Существует

- SSR runtime TanStack Start/Nitro;
- server error wrapper;
- CSRF middleware для будущих server functions;
- client-side React Query infrastructure без запросов.

## 11. Авторизация и роли

Отсутствуют:

- регистрация и вход;
- users/sessions/accounts;
- cookies/token logic приложения;
- protected routes;
- tenant isolation;
- RBAC/ABAC;
- роли сотрудников;
- личный кабинет;
- административная система;
- audit log.

Кнопка «Личный кабинет» — исключительно toast-заглушка.

## 12. Интеграции и аналитика

В коде не обнаружены аналитические SDK/скрипты, event schema, Яндекс Метрика, GA, PostHog, error tracking внешнего провайдера, 1С, карты, CRM, телефония, email или SMS.

`lovable-error-reporting.ts` связан с окружением/инструментами Lovable и обработкой ошибок прототипа; это не продуктовая аналитика и не заменяет production observability.

Единственные внешние browser-запросы контента — Google Fonts. Карта и видео являются визуальными заглушками.

## 13. Конфигурация сборки и deployment target

`vite.config.ts` использует `@lovable.dev/vite-tanstack-config`. В исходном состоянии preset не был задан явно, поэтому Lovable-конфигурация выбирала Cloudflare по умолчанию.

На Этапе 0.1 в существующий `defineConfig` добавлено минимальное поддерживаемое переопределение:

```ts
nitro: {
  preset: "node-server",
}
```

Настройка передаётся Lovable preset непосредственно в `nitro()` и не дублирует plugins TanStack Start, React, Tailwind или Nitro. Custom server entry `src/server.ts` сохранён.

Production build теперь должен создавать стандартный Node entry `.output/server/index.mjs`. Команда запуска закреплена как `npm start`, которая выполняет `node .output/server/index.mjs`.

Целевая production-архитектура:

```text
Internet
  → HTTPS / Nginx reverse proxy
  → 127.0.0.1:3000
  → Node.js 22.23.2
  → TanStack Start / Nitro node-server
  → PM2 process: rang
```

Deployment выполняется на VPS Timeweb Cloud под Ubuntu 24.04, не в Cloudflare Workers. Cloudflare/Wrangler deployment не является частью проекта и не должен добавляться в последующих этапах.

## 14. SEO

### 14.1 Реализовано

- SSR;
- title и description для root и `/`;
- Open Graph title/description/type;
- `twitter:card`;
- один H1 и логичная H2/H3-структура;
- alt-тексты у контентных изображений;
- `robots.txt` разрешает обход всем роботам;
- favicon;
- семантические секции и article для карточек.

### 14.2 Отсутствует или проблемно

- `<html lang="en">` при русском контенте;
- `sitemap.xml`;
- canonical;
- `og:url`, `og:image`, locale;
- полные Twitter meta;
- JSON-LD (`Organization`, `RealEstateAgent`/подходящий business type, Offer/Product, Breadcrumb);
- индексируемые URL каталога, объектов и помещений;
- реальные юридические страницы;
- индивидуальные metadata для сущностей;
- `noindex` для демонстрационных/служебных страниц не актуализирован;
- 404/error страницы на английском;
- контакты-заглушки и явная пометка «демонстрационная версия» на production.

Production-аудит ранее показал те же метаданные и `lang=en`; исходники полностью подтвердили причину.

## 15. Адаптивность и доступность

### 15.1 Адаптивность

- Tailwind breakpoints `sm`, `lg`, `xl` используются во всех секциях;
- навигация переключается на мобильное меню ниже `xl`;
- CTA и сетки перестраиваются в 1/2/4 колонки;
- hero typography масштабируется;
- чат ограничен шириной viewport;
- `use-mobile.tsx` определяет mobile как `<768px`, но прикладные RANG-компоненты этот hook не используют.

Архитектура CSS выглядит адаптивной, но automated visual/regression tests отсутствуют. Реальные браузерные проверки breakpoint-матрицы не зафиксированы в репозитории.

### 15.2 Доступность — риски

- кнопка меню имеет `aria-label`, но не имеет `aria-expanded`/`aria-controls`;
- чат не является dialog и не управляет focus trap/return focus;
- основная форма не содержит программно связанных error messages;
- поля не имеют name/required/autocomplete/inputMode;
- кнопки-заглушки используются вместо ссылок на будущие страницы;
- reveal-анимация не учитывает `prefers-reduced-motion`;
- focus styles в основном зависят от браузера/локальных border changes;
- accessibility tests отсутствуют.

## 16. Дизайн-система и повторное использование

Цвета реализованы в `styles.css` через OKLCH-переменные и соответствуют обязательной палитре:

- cream `#F4F4F1`;
- graphite `#252A2D`;
- primary `#18332F`;
- olive `#7C8062`;
- navy `#24384A`;
- surface `#FFFFFF`;
- border `#D9DAD5`.

Можно переиспользовать:

- root shell, router и SSR error boundary;
- Header/Footer и секционную композицию;
- design tokens, typography, контейнеры и responsive classes;
- карточки как визуальную основу;
- shadcn/Radix UI primitives;
- FAQ accordion, toast и modal primitives;
- React Query infrastructure;
- статические изображения до замены на реальные материалы.

Требуют эволюционной доработки, а не переписывания:

- модель данных помещений;
- разделение крупного `Sections.tsx`;
- формы и validation;
- router tree;
- API/service/repository boundaries;
- auth/RBAC;
- SEO entity pages;
- AI mock.

## 17. Готовность к будущим функциям

| Функция | Текущая основа | Готовность |
|---|---|---|
| Публичный каталог | карточки и mock-массивы | UI-прототип; data/API/URL отсутствуют |
| Карточка помещения | CTA и карточка-preview | отдельного маршрута/модели нет |
| Избранное | UI primitives доступны | реализации и identity нет |
| Заявки | две mock-формы | backend/storage/workflow отсутствуют |
| Кабинет арендатора | кнопка-заглушка | не реализован |
| Admin | shadcn primitives | не реализован |
| Роли | нет | не реализованы |
| База данных | нет | не реализована |
| 1С | нет | не реализована |
| Уведомления | toast только в браузере | продуктовых уведомлений нет |
| Статистика | Recharts dependency доступна | событий и данных нет |
| AI | keyword mock UI | API/RAG/guardrails нет |

Проект имеет пригодный frontend-фундамент, но не платформенный фундамент цифровой системы.

## 18. Рекомендуемая техническая последовательность

1. Сохранять явно закреплённый node-server deployment target для Timeweb Cloud и проверять preset после изменений зависимостей.
2. Поддерживать документированные build/start команды, env names, reverse proxy и rollback procedure.
3. Создать staging, воспроизводимый build/start и smoke test.
4. Согласовать доменную модель: object, premise, media, availability, price, feature, application, tenant, user, role.
5. Затем выбрать совместимый с текущей архитектурой persistence/auth подход; изменение оформить отдельным ADR и получить подтверждение.
6. Реализовать admin CRUD и audit trail до динамического публичного каталога.
7. Подключить заявки, согласия, anti-spam и notification outbox.
8. После устойчивой модели данных — кабинет, избранное и аналитика.
9. 1С подключать через versioned adapter с idempotency/reconciliation.
10. AI подключать последним к утверждённой базе знаний с PII policy и human handoff.

## 19. Обнаруженные проблемы и риски

### Критические

1. Цифровые подсистемы не имеют backend/БД/auth основы.

### Высокие

2. Все бизнес-данные являются demo/static и не имеют ID/relations/publication workflow.
3. Формы создают визуальное впечатление приёма заявки, но ничего не отправляют и не сохраняют.
4. Нет consent/ПДн-процесса для будущих реальных заявок.
5. Нет тестов, staging-конфигурации, CI и миграционной стратегии в репозитории.
6. Нет tenant isolation/RBAC/audit log.
7. Production содержит нулевой телефон, `example.ru`, карту-заглушку и демонстрационную оговорку.

### Средние

8. ESLint не проходит: 22 Prettier errors и 6 React Refresh warnings. На Этапе 0 не исправлялось.
9. Нет отдельного typecheck/test script.
10. Единственная index page ограничивает SEO каталога.
11. `lang=en`, неполные social metadata, нет sitemap/canonical/JSON-LD.
12. `Sections.tsx` объединяет 16 секций и локальные data collections.
13. `package.json` использует широкие ranges; установка не через Bun lock получает отличающиеся версии.
14. Nitro — beta-версия.
15. Внешние Google Fonts влияют на privacy/performance/availability.
16. Client bundle `index` около 376 KB (около 118 KB gzip); бюджет производительности не задан.

## 20. Результаты проверок

### Build

На Этапе 0 исходный `vite build` успешно завершился и подтвердил прежний Cloudflare default. На Этапе 0.1 после явного закрепления preset выполнена чистая production-сборка из dependency tree, установленного командой `npm install --package-lock=false`:

- `npm install` завершился успешно: 412 packages, 0 vulnerabilities;
- `vite build` завершился успешно;
- Nitro сообщил `preset: node-server`;
- создан `.output/server/index.mjs`;
- `.output/server/wrangler.json` не создан;
- каталог `.wrangler` не создан;
- файлов с именами `wrangler`, `cloudflare` или `worker` в `.output` не обнаружено.

Локальная проверка выполнена доступным Node 24; production runtime по предоставленной серверной конфигурации — Node.js 22.23.2. Зафиксированные версии исходного dependency tree по-прежнему определяются `bun.lock`; новый npm lock-файл намеренно не добавлялся.

### Start smoke test

Команда `node .output/server/index.mjs` успешно запустила сервер на `127.0.0.1:3000`. HTTP-запрос к `/` вернул `200`, `content-type: text/html; charset=utf-8` и SSR-разметку с заголовком «Коммерческие помещения для вашего бизнеса». После проверки процесс корректно остановлен.

### Проверка кроссбраузерности

Кроссбраузерная проверка выполнена на реально запущенной production-сборке. Полный протокол находится в `CROSS_BROWSER_REPORT.md`.

Автоматизированная матрица включала:

- установленный Google Chrome 151: desktop 1440 px, tablet 768 px, mobile 390 px;
- Firefox 141: desktop 1440 px и mobile 390 px;
- WebKit 26: desktop 1440 px;
- WebKit iPhone 13 emulation: 390 px;
- WebKit iPad Mini emulation: 768 px;
- Chromium Pixel 7/Android emulation: 412 px;
- Chromium desktop как engine-level proxy для Microsoft Edge.

Во всех конфигурациях подтверждены HTTP 200, SSR, hydration, 15 секций страницы, меню, hash-навигация, фильтр, форма, FAQ, AI-помощник, изображения, шрифты и responsive layout. Console/page errors, failed requests, HTTP 4xx/5xx assets и горизонтальный overflow отсутствовали. OKLCH, `backdrop-filter`, `aspect-ratio` и dynamic viewport units поддерживаются проверенными движками.

Кроссбраузерных дефектов, требующих изменения кода, не найдено. Нативный Edge не установлен; нативный Safari WebDriver заблокирован выключенной настройкой `Allow remote automation`; iOS/Android проверены через device emulation, не физические устройства. Поэтому engine-level compatibility подтверждена, а полный physical-device sign-off остаётся отдельной ручной контрольной точкой.

### Lint

ESLint завершился с ошибкой:

- 22 форматирующие ошибки Prettier;
- 6 предупреждений `react-refresh/only-export-components`.

Автоисправление не запускалось.

### Tests

Тесты отсутствуют; test script отсутствует.

## 21. Сопоставление с production-аудитом

| Наблюдение production | Подтверждение в исходниках |
|---|---|
| Одна страница и hash-навигация | единственный route `/`, `NAV` с hash href |
| Статические помещения | `FREE_PREMISES`/`SOON_PREMISES` в `rang.ts` |
| Формы не имеют name/required | подтверждено JSX |
| Формы не отправляют данные | `preventDefault`, state и toast |
| Контакты и карта — заглушки | literal values в `Contacts` |
| Кнопки вместо страниц | demo handlers в `Sections`, Header, Footer |
| AI — демонстрационный | локальная keyword function `reply()` |
| `lang=en` | `RootShell` в `__root.tsx` |
| Нет JSON-LD/canonical | отсутствуют в route head |
| Production assets | локальный build дал те же hashes |

## 22. Необходимые данные и доступы от заказчика

До начала Этапа 1 нужны:

1. CI/CD или ручной deployment регламент.
2. Staging и rollback/backup регламент.
3. Перечень env variable names без секретных значений.
4. Реальные помещения, объекты, цены, availability, фото и правила публикации.
5. Реальные контакты, карта, видео и юридические документы.
6. Согласованная модель заявок, статусы, SLA и ответственные.
7. Сценарии арендатора и матрица ролей сотрудников.
8. Требования по ПДн и срокам хранения.
9. Конфигурация и тестовый контур 1С, описание обмена и master data.
10. Каналы уведомлений и аналитические цели.
11. Источники знаний, ограничения и handoff AI-помощника.

Секреты нельзя передавать в Git, коде или этом документе. Нужны секрет-хранилище/переменные окружения и минимальные права.

## 23. Готовность к Этапу 1

**Готов к началу Этапа 1 после подтверждения результатов Этапа 0.1 заказчиком.**

Deployment blocker снят на уровне репозитория: production target явно закреплён как Nitro `node-server`, а стандартная start-команда запускает `.output/server/index.mjs`. Существующий frontend можно развивать без переписывания и без изменения фирменного стиля.

## 24. Ограничения для следующих этапов

- перед каждым этапом перечитывать этот файл;
- отдельная Git-ветка и отдельный commit на этап;
- не переписывать Git-историю: проект связан с Lovable;
- не менять архитектуру без описания причины и подтверждения;
- не возвращать production build на Cloudflare preset;
- не менять установленную палитру;
- не хранить секреты в коде;
- не deploy на production без отдельного подтверждения;
- после каждого этапа выполнять build и доступные проверки;
- не исправлять несвязанные проблемы вне scope этапа.

## 25. Актуализация после Этапа 2

Этап 2 развивает существующую frontend-архитектуру без backend, базы данных и авторизации.

- `src/data/rang.ts` является единым статическим источником данных каталога. Массив `PROPERTIES` использует типизированную модель `Property` с `id`, `slug`, типом, назначениями, объектом и адресом, известными значениями площади и стоимости, структурированным статусом, предполагаемым сроком освобождения, режимом доступа, фотографиями и характеристиками.
- Старые отдельные массивы свободных и скоро освобождающихся помещений удалены. Главная страница, каталог, карточки и страницы помещений получают записи из `PROPERTIES`.
- Общая функция `filterProperties` используется каталогом и быстрым подбором главной страницы. Фильтры работают только по полям, реально присутствующим в текущих статических данных.
- Добавлены индексируемые маршруты `/properties` и `/properties/$slug`, а также локальный раздел `/favorites` с `noindex`.
- Избранное хранит только идентификаторы помещений в `localStorage`. Чтение выполняется после клиентской гидратации; серверный рендеринг не обращается к browser-only API.
- CTA страницы помещения и форма интереса не отправляют и не сохраняют данные. Будущая серверная точка интеграции должна связывать `пользователь → помещение → тип интереса → заявка/уведомление`.
- Для переноса избранного в аккаунт потребуется серверная модель пользователя и механизм слияния локальных идентификаторов с серверным списком после авторизации.
- Полное наполнение каталога из Excel, backend/API/БД, заявки, уведомления, авторизация и административное управление статусами остаются задачами следующих этапов.
- Production target не менялся: Nitro `node-server` на VPS Timeweb Cloud в архитектуре `Internet → Nginx → Node.js / TanStack Start / Nitro → PM2`.
