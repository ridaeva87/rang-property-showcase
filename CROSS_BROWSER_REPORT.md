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
