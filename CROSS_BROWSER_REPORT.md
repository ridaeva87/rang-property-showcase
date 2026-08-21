# RANG — отчёт о кроссбраузерной проверке

Дата: 14 августа 2026 года  
Ветка: `chore/stage-0.1-node-server`  
Проверяемое приложение: локально запущенная production-сборка Nitro `node-server`  
URL теста: `http://127.0.0.1:3000/`

## 1. Область проверки

Проверка выполнялась на реально запущенном `.output/server/index.mjs`, а не на основании одного результата build. Для каждой автоматизированной среды проверялись:

- HTTP 200 и наличие SSR-разметки;
- загрузка 15 секций главной страницы;
- отсутствие белого экрана;
- клиентская гидратация и интерактивность;
- Console errors, uncaught page errors, failed requests и ответы HTTP 4xx/5xx;
- навигация и hash-переход к контактам;
- desktop/mobile меню;
- фильтр и demo toast;
- FAQ accordion;
- форма заявки и её demo success-state;
- AI-помощник: открытие, ввод, отправка, ответ и закрытие;
- все уникальные изображения отдельными HTTP-запросами;
- загрузка web fonts;
- отсутствие горизонтального overflow;
- поддержку используемых CSS-возможностей: OKLCH, `backdrop-filter`, `aspect-ratio`, dynamic viewport units;
- responsive layout на desktop, tablet и mobile.

## 2. Проверенные среды

| Среда | Версия / viewport | Тип проверки | Результат |
|---|---|---|---|
| Google Chrome | установленный Chrome 151.0.7922.138, 1440×900 | реальный browser binary, headless | пройдено |
| Google Chrome | 768×1024 | установленный Chrome, tablet viewport | пройдено |
| Google Chrome | 390×844, touch/mobile context | установленный Chrome, mobile viewport | пройдено |
| Mozilla Firefox | Playwright Firefox 141.0, 1440×900 | реальный Firefox engine binary | пройдено |
| Mozilla Firefox | 390×844 | Firefox mobile viewport | пройдено |
| Safari/WebKit | WebKit 26.0, 1440×900 | Safari-compatible WebKit engine | пройдено |
| Safari на iPhone | iPhone 13, 390 px | WebKit device emulation | пройдено |
| Safari на iPad | iPad Mini, 768 px | WebKit device emulation | пройдено |
| Chrome на Android | Pixel 7, 412 px, Android UA/touch | Chromium device emulation | пройдено |
| Microsoft Edge | Chromium 140, 1440×900 | общий Chromium engine proxy | пройдено на уровне движка |

## 3. Итог автоматизированной матрицы

Во всех десяти конфигурациях:

- сервер вернул HTTP 200;
- H1 и все секции присутствовали;
- клиентские обработчики работали после SSR;
- menu/anchor/filter/form/FAQ/AI сценарии прошли;
- Console errors: 0;
- uncaught JavaScript errors: 0;
- failed Network requests: 0;
- HTTP 4xx/5xx resources: 0;
- недоступные image assets: 0;
- горизонтальный scroll/overflow: не обнаружен;
- шрифты получили состояние `loaded`;
- проверенные CSS-возможности поддерживаются всеми тремя движками.

Native lazy loading оставлял часть находящихся вне viewport `<img>` в состоянии `complete=false` в отдельных Chrome/Android прогонах. Все уникальные image URLs дополнительно запрошены в том же browser context и вернули успешные ответы. Ошибок Network или отсутствующих изображений не обнаружено; это ожидаемое поведение lazy loading, а не дефект совместимости.

## 4. Обнаруженные проблемы

Кроссбраузерных дефектов существующего сайта, требующих изменения исходного кода, в автоматизированной матрице не обнаружено.

Следовательно, визуальный/функциональный код в рамках этой проверки не менялся.

## 5. Ограничения проверки

Следующие пункты нельзя считать проверенными на физическом/нативном устройстве в текущей среде:

- нативный Microsoft Edge: приложение не установлено; использован тот же Chromium engine, но не Edge binary;
- нативный Safari 26.5.2: Safari установлен, однако Safari WebDriver отказал в создании сессии, поскольку в Safari Settings → Developer отключено `Allow remote automation`;
- физические iPhone/iPad: использована WebKit device emulation;
- физический Android: использована Chromium Pixel 7 emulation.

WebKit/Chromium emulation проверяет движок, viewport, touch context и user agent, но не заменяет финальный smoke-test на физических устройствах, включая особенности browser chrome, safe areas, экранную клавиатуру и аппаратную производительность.

Для полного device-level sign-off рекомендуется:

1. включить `Allow remote automation` в Safari и повторить native Safari run;
2. выполнить smoke-test в установленном Microsoft Edge;
3. проверить production URL на одном актуальном iPhone, iPad и Android-устройстве либо в облаке реальных устройств.

## 6. Проблемы, оставленные для следующих этапов

Не исправлялись ранее зафиксированные проблемы, не являющиеся блокерами кроссбраузерности:

- демонстрационные формы и CTA;
- SEO и `lang="en"`;
- ESLint/Prettier;
- отсутствие backend, БД, auth и аналитики;
- accessibility-улучшения;
- демонстрационные контакты и данные.

## 7. Заключение

Production build Nitro `node-server` подтверждён как работоспособный в актуальных движках Chromium, Firefox и WebKit на desktop/tablet/mobile viewport. Критических JavaScript, SSR, hydration, resource-loading, Tailwind CSS 4 или responsive-layout проблем не обнаружено.

Полное утверждение «проверено в нативном Edge, нативном Safari и на физических iOS/Android-устройствах» пока было бы некорректным. Для него требуется дополнительный device-level прогон, описанный выше.

## 8. Повторная проверка после Этапа 2

После добавления каталога, страниц помещений и избранного повторно запущена production-сборка Nitro `node-server` и выполнена браузерная матрица:

- Google Chrome 151, desktop 1440 × 1000;
- Chromium, desktop 1440 × 1000 — engine-level proxy для Edge;
- Firefox, desktop 1440 × 1000;
- WebKit, desktop 1440 × 1000;
- WebKit, iPad 768 × 1024;
- WebKit, iPhone 390 × 844;
- Chromium, Android 412 × 915.

На каждой конфигурации проверены `/`, `/properties`, прямая страница `/properties/sklad-8-ak-153a`, reload страницы помещения и `/favorites`. Подтверждены одиночные и комбинированные фильтры, пустой результат, сброс, добавление и удаление избранного, сохранение избранного после reload, мобильная навигация, быстрый подбор главной, CTA помещения со статусом «Скоро освободится» и вход в существующий AI-помощник.

Результат: все сценарии прошли; Console errors, uncaught JavaScript errors, failed requests, HTTP 4xx/5xx ресурсов и горизонтальный overflow отсутствуют. Ограничения нативных Edge/Safari и физических устройств остаются теми же, что указаны в разделе 5.

## 9. Повторная проверка после Этапа 3

Подробная карточка проверена на реально запущенной production-сборке Nitro `node-server`:

- Google Chrome 151 и Chromium/Edge engine — desktop 1440 × 1000;
- Firefox — desktop 1440 × 1000;
- WebKit/Safari engine — desktop 1440 × 1000, tablet 768 × 1024 и mobile 390 × 844;
- Chromium Android — 412 × 915.

Проверены прямой URL и reload, SSR/hydration, длинный текст парковки, группировка характеристик, отсутствие пустых групп, отсутствие подтверждённых фото и видео, статус «Скоро освободится» и дата, все CTA, существующее избранное с сохранением после reload, desktop/tablet/mobile layout и горизонтальный overflow.

Функциональные сценарии прошли во всех движках. Ошибок JavaScript приложения, локальных Network failures и HTTP 4xx/5xx ресурсов сборки нет. В Firefox зафиксированы HTTP 404 отдельных внешних файлов `Onest` с `fonts.gstatic.com`; это существующая внешняя зависимость общей оболочки и не вызвано изменениями Этапа 3. Браузер использует fallback font. Исправление/самостоятельный хостинг шрифтов оставлены отдельной задачей, поскольку не блокируют карточку и выходят за scope этапа.

## 10. Проверка после Этапа 4

Production build Nitro `node-server` собран успешно. Для `/`, `/rent`, `/sale`, `/services`, `/objects`, `/objects/adelya-kutuya-153a`, `/about`, `/properties`, `/properties/sklad-8-ak-153a` и `/favorites` выполнен полный SSR GET через собранный Nitro SSR handler: все маршруты вернули HTTP 200, HTML с `lang="ru"` и непустой SSR-контент. Оригинальный PDF лицензии и PNG-превью присутствуют в `.output/public`; контрольная сумма исходного и опубликованного PDF совпадает.

После снятия ограничения локальной среды production-сборка была реально запущена через `.output/server/index.mjs` на Node.js. Выполнена автоматизированная матрица:

- Google Chrome desktop — 1440 × 1000;
- Chromium desktop — 1440 × 1000, engine-level proxy для Microsoft Edge;
- Firefox desktop — 1440 × 1000;
- WebKit/Safari engine desktop — 1440 × 1000;
- WebKit iPad — 768 × 1024;
- WebKit iPhone — 390 × 844;
- Chromium Android — 412 × 915.

Во всех конфигурациях проверены `/`, `/rent`, `/sale`, `/services`, `/objects`, `/objects/adelya-kutuya-153a` и `/about`; дополнительно проверены переход аренды в отфильтрованный `/properties`, мобильное меню, открытие увеличенного превью лицензии, прямой URL и reload объекта, текст парковки АК 153А и наличие единственного `h1`. Все сценарии прошли. Console errors, uncaught JavaScript errors, локальные failed Network requests, HTTP 4xx/5xx ресурсов и горизонтальный overflow отсутствуют. Интерактивные действия после SSR подтверждают успешную клиентскую гидратацию.

Нативный Microsoft Edge не установлен и проверен через общий Chromium engine. Safari проверен через WebKit engine, а iPad/iPhone/Android — через device emulation; ограничения physical-device sign-off из раздела 5 остаются актуальными.

## 11. Контрольная проверка после Этапа 5

Frontend-компоненты и визуальные стили на Этапе 5 не изменялись; добавлен изолированный server/database слой, который пока не подключён к публичным route loaders до разрешённого создания production-БД. Поэтому выполнен пропорциональный контрольный прогон локальной production-сборки Nitro `node-server` во встроенном Chromium-браузере:

- desktop 1280 px: `/properties`, 7 карточек, корректный H1, без overflow;
- карточка `/properties/sklad-8-ak-153a`: hydration подтверждена переключением локального избранного `aria-pressed=false → true`;
- tablet 768 × 1024: `/objects/adelya-kutuya-153a`, без overflow;
- mobile 390 × 844: `/about`, без overflow;
- Console warning/error во всех проверках: 0.

Дополнительно полный SSR GET smoke-test проверил `/`, `/properties`, карточку помещения, `/favorites`, `/rent`, `/sale`, `/services`, `/objects`, карточку объекта и `/about`: HTTP 200, `lang=ru`, один H1. PDF лицензии вернул HTTP 200 и 1 043 984 байта. Полная междвижковая матрица не повторялась, так как клиентский код не менялся; актуальными остаются результаты Этапа 4.

## 12. Проверка адаптивности header после Этапа 5

Исправлен конфликт ширины полной навигации и прежнего breakpoint `xl`: desktop-header больше не включается раньше, чем способен физически поместиться. Проверены production-сборка и реально гидратированная страница на ширинах 768, 900, 960, 1024, 1100, 1199, 1200, 1280, 1366, 1440, 1536, 1680, 1899, 1900 и 1920 px.

- 768–1199 px: логотип и burger-menu;
- 1200–1899 px: компактный desktop-header с избранным, личным кабинетом, CTA и burger-menu;
- от 1900 px: полная навигация и CTA без burger-menu;
- все видимые элементы header целиком находятся внутри viewport;
- горизонтальный overflow отсутствует на каждой проверенной ширине;
- раскрытое burger-menu и его CTA целиком находятся внутри viewport;
- `aria-expanded` корректно меняется при открытии меню;
- Console warning/error: 0.
