import { toast } from "sonner";
import {
  ArrowRight,
  Play,
  Wrench,
  Zap,
  Droplets,
  Gauge,
  Cog,
  Truck,
  Plus,
  Clock,
  CalendarRange,
  Building2,
  Warehouse,
  Layers,
  SquareStack,
  MapPin,
  Phone,
  Mail,
  Bot,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ, OBJECTS, PREMISE_TYPES, PROPERTIES, type PropertyFilters } from "@/data/rang";
import { filterProperties, hasActivePropertyFilters } from "@/lib/properties";
import { PropertyCard } from "@/components/rang/PropertyCard";
import aboutImage from "@/assets/object-ak153.jpg";
import videoWarehouse from "@/assets/type-warehouse.jpg";
import videoTerritory from "@/assets/object-tolbuhina19.jpg";
import videoCombined from "@/assets/type-combined.jpg";

const demo = (message: string) => () => toast(message);

export function SectionHead({
  eyebrow,
  title,
  subtitle,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2
        className={`mt-3 text-3xl font-semibold sm:text-4xl ${
          tone === "dark" ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-base ${
            tone === "dark" ? "text-primary-foreground/75" : "text-muted-foreground"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* 5. Свободные помещения */
export function FreePremises({
  filters,
  onReset,
}: {
  filters: PropertyFilters;
  onReset: () => void;
}) {
  const premises = filterProperties(
    PROPERTIES.filter((property) => property.status === "Свободно"),
    filters,
  );
  const isFiltered = hasActivePropertyFilters(filters);

  return (
    <section id="free" className="container-rang py-20 lg:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead
          eyebrow="Каталог"
          title="Свободные помещения"
          subtitle="Помещения, доступные для аренды прямо сейчас"
        />
        <a
          href="/properties"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          Смотреть все помещения
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {isFiltered && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-border bg-card px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Найдено помещений:{" "}
            <span className="font-semibold text-foreground">{premises.length}</span>
          </p>
          <button onClick={onReset} className="text-sm font-semibold text-primary">
            Сбросить параметры
          </button>
        </div>
      )}

      <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {premises.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
      {premises.length === 0 && (
        <div className="mt-12 border border-border bg-card p-8 text-center sm:p-12">
          <h3 className="text-xl font-semibold">Подходящих помещений пока нет</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Измените параметры подбора или посмотрите все доступные варианты.
          </p>
          <button
            onClick={onReset}
            className="mt-6 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Показать все помещения
          </button>
        </div>
      )}
    </section>
  );
}

/* 6. Скоро освободятся */
export function ComingSoon() {
  const properties = PROPERTIES.filter((property) => property.status === "Скоро освободится");

  return (
    <section className="bg-graphite py-20 lg:py-28">
      <div className="container-rang">
        <SectionHead
          eyebrow="Предварительная заявка"
          title="Скоро освободятся"
          subtitle="Помещения, на которые уже можно оставить предварительную заявку"
          tone="dark"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} dark />
          ))}
        </div>
      </div>
    </section>
  );
}

/* 7. Типы помещений */
export function PremiseTypes() {
  return (
    <section className="container-rang py-20 lg:py-28">
      <SectionHead eyebrow="Типы помещений" title="Подберите помещение под задачи бизнеса" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PREMISE_TYPES.map((t) => (
          <a
            key={t.title}
            href={`/properties?type=${encodeURIComponent(t.type)}`}
            className="media-zoom group relative isolate aspect-[3/4] overflow-hidden text-left"
          >
            <img
              src={t.image}
              alt={t.title}
              loading="lazy"
              className="absolute inset-0 -z-20 size-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-graphite/90 via-graphite/35 to-graphite/5 transition-opacity duration-500 group-hover:from-primary/95 group-hover:via-primary/45" />
            <div className="relative flex size-full flex-col justify-end p-6">
              <h3 className="text-2xl font-semibold text-primary-foreground">{t.title}</h3>
              <p className="mt-2 text-sm text-primary-foreground/75">{t.text}</p>
              <p className="mt-2 text-xs text-primary-foreground/60">
                В каталоге: {PROPERTIES.filter((property) => property.type === t.type).length}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground opacity-0 transition-all duration-500 group-hover:opacity-100">
                Смотреть <ArrowRight className="size-4" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/* 8. Наши объекты */
export function Objects() {
  return (
    <section className="bg-surface py-20 lg:py-28">
      <div className="container-rang">
        <SectionHead eyebrow="География" title="Наши объекты" />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {OBJECTS.map((o) => (
            <article
              key={o.name}
              className="card-lift media-zoom flex flex-col bg-background shadow-card"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img src={o.image} alt={o.name} loading="lazy" className="size-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-6 lg:p-8">
                <h3 className="text-2xl font-semibold">{o.name}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                  {o.location}
                </p>
                <p className="mt-4 text-sm text-foreground/75">{o.info}</p>
                <button
                  onClick={demo("Демо-режим: помещения объекта появятся в рабочей версии")}
                  className="mt-6 w-fit border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  Посмотреть помещения
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 9. Аренда */
const RENT_OPTIONS = [
  {
    icon: CalendarRange,
    title: "Долгосрочная аренда",
    text: "Стабильные условия для развития бизнеса",
  },
  { icon: Clock, title: "Краткосрочная аренда", text: "Помещение на ограниченный срок" },
  { icon: Building2, title: "Офисы", text: "Рабочие пространства разной площади" },
  { icon: Warehouse, title: "Склады", text: "Хранение и обработка товара" },
  { icon: Layers, title: "Офис + склад", text: "Офис и склад в одном месте" },
  {
    icon: SquareStack,
    title: "Аренда части помещения",
    text: "Площадь под фактическую потребность",
  },
];

export function RentSection() {
  return (
    <section id="rent" className="bg-primary py-20 lg:py-28">
      <div className="container-rang">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHead
              eyebrow="Аренда"
              title="Аренда для бизнеса"
              subtitle="Мы предлагаем помещения под конкретные задачи: от небольшого офиса до складского блока с отдельным входом. Возможна аренда части помещения и комбинированные варианты."
              tone="dark"
            />
            <a
              href="#search"
              className="mt-8 inline-flex bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Подобрать помещение
            </a>
          </div>
          <div className="grid gap-px bg-primary-foreground/12 sm:grid-cols-2">
            {RENT_OPTIONS.map((o) => (
              <div
                key={o.title}
                className="bg-primary p-6 transition-colors hover:bg-primary-foreground/5"
              >
                <o.icon className="size-6 text-accent" />
                <h3 className="mt-4 text-lg font-semibold text-primary-foreground">{o.title}</h3>
                <p className="mt-2 text-sm text-primary-foreground/65">{o.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Продажа */
export function SaleSection() {
  return (
    <section id="sale" className="container-rang py-20 lg:py-24">
      <div className="flex flex-col gap-8 border border-border bg-card p-8 lg:flex-row lg:items-center lg:justify-between lg:p-12">
        <div className="max-w-2xl">
          <p className="eyebrow">Продажа</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Продажа коммерческой недвижимости
          </h2>
          <p className="mt-4 text-muted-foreground">
            Отдельные помещения и объекты коммерческого назначения. Условия и доступные варианты
            уточняются у сотрудника компании.
          </p>
        </div>
        <button
          onClick={demo("Демо-режим: раздел продажи появится в рабочей версии")}
          className="w-fit bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
        >
          Узнать о продаже
        </button>
      </div>
    </section>
  );
}

/* 10. Дополнительные услуги */
const SERVICES = [
  { icon: Wrench, title: "Переоборудование помещения" },
  { icon: Zap, title: "Электромонтажные работы" },
  { icon: Droplets, title: "Сантехнические работы" },
  { icon: Gauge, title: "Дополнительные электрические мощности" },
  { icon: Cog, title: "Установка оборудования" },
  { icon: Truck, title: "Погрузочно-разгрузочные работы" },
  { icon: Plus, title: "Другие работы" },
];

export function Services() {
  return (
    <section id="services" className="bg-surface py-20 lg:py-28">
      <div className="container-rang">
        <SectionHead
          eyebrow="Услуги"
          title="Всё необходимое для вашего помещения"
          subtitle="Помимо помещений компания помогает арендаторам с техническими работами и подготовкой площади под задачи бизнеса."
        />
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group bg-surface p-7 transition-colors hover:bg-background"
            >
              <s.icon className="size-6 text-accent transition-transform duration-500 group-hover:-translate-y-1" />
              <h3 className="mt-5 text-base font-semibold">{s.title}</h3>
            </div>
          ))}
          <div className="flex items-center bg-primary p-7">
            <button
              onClick={demo("Демонстрационный режим: заявка на работы пока не отправляется")}
              className="text-left text-base font-semibold text-primary-foreground"
            >
              Оставить заявку
              <ArrowRight className="mt-3 size-5 text-accent" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 11. Видеообзоры */
const VIDEOS = [
  { title: "Видеообзор склада 193,7 м²", image: videoWarehouse },
  { title: "Обзор территории АК 153А", image: videoTerritory },
  { title: "Офисно-складское помещение", image: videoCombined },
];

export function Videos() {
  return (
    <section className="container-rang py-20 lg:py-28">
      <SectionHead
        eyebrow="Видео"
        title="Посмотрите помещение до визита"
        subtitle="Видеообзоры помогут предварительно оценить помещение и территорию"
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {VIDEOS.map((v) => (
          <button
            key={v.title}
            onClick={demo("Демо-режим: видеообзоры будут подключены в рабочей версии")}
            className="media-zoom group relative isolate aspect-[16/10] overflow-hidden text-left"
          >
            <img
              src={v.image}
              alt={v.title}
              loading="lazy"
              className="absolute inset-0 -z-20 size-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-graphite/45 transition-colors duration-500 group-hover:bg-primary/55" />
            <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground/50 bg-primary-foreground/15 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
              <Play className="size-6 text-primary-foreground" />
            </span>
            <span className="absolute inset-x-0 bottom-0 p-6 text-base font-semibold text-primary-foreground">
              {v.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* 12. Бизнесы арендаторов */
const TENANTS = [
  {
    name: "Автосервис",
    category: "Услуги для автомобилей",
    text: "Ремонт и обслуживание автомобилей на территории объекта.",
  },
  {
    name: "Мебельное производство",
    category: "Производство",
    text: "Изготовление мебели на заказ в собственном цехе.",
  },
  {
    name: "Логистическая компания",
    category: "Логистика",
    text: "Складская обработка и доставка грузов.",
  },
  {
    name: "Оптовая компания",
    category: "Оптовая торговля",
    text: "Складские остатки и отгрузка партий товара.",
  },
];

export function Tenants() {
  return (
    <section id="tenants" className="bg-surface py-20 lg:py-28">
      <div className="container-rang">
        <SectionHead
          eyebrow="Арендаторам"
          title="Бизнесы наших арендаторов"
          subtitle="Компании, которые работают на наших площадках"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {TENANTS.map((t) => (
            <article
              key={t.name}
              className="card-lift flex flex-col border border-border bg-background p-6"
            >
              <div className="flex size-14 items-center justify-center border border-border bg-surface font-display text-lg font-bold text-primary">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="mt-5 text-[0.7rem] font-semibold tracking-[0.12em] text-accent uppercase">
                {t.category}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{t.name}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{t.text}</p>
              <button
                onClick={demo("Демо-режим: страница арендатора появится в рабочей версии")}
                className="mt-5 w-fit text-sm font-semibold text-primary"
              >
                Подробнее →
              </button>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-6 bg-primary p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
          <p className="max-w-2xl text-lg font-semibold text-primary-foreground sm:text-xl">
            Новым арендаторам — первый месяц размещения информации о бизнесе на сайте бесплатно
          </p>
          <button
            onClick={demo("Демонстрационный режим: заявка пока не отправляется")}
            className="w-fit bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Разместить бизнес
          </button>
        </div>
      </div>
    </section>
  );
}

/* 13. О компании */
export function About() {
  return (
    <section id="about" className="container-rang py-20 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="media-zoom aspect-[4/3] overflow-hidden">
          <img
            src={aboutImage}
            alt="Территория коммерческого объекта компании «Ранг»"
            loading="lazy"
            className="size-full object-cover"
          />
        </div>
        <div>
          <SectionHead eyebrow="О компании" title="Работаем с бизнесом с 1993 года" />
          <p className="mt-6 text-muted-foreground">
            «Ранг» много лет работает с коммерческой недвижимостью и предоставляет помещения для
            разных направлений бизнеса: офисы, склады и комбинированные помещения. Мы знаем свои
            объекты и помогаем подобрать площадь под реальные задачи арендатора.
          </p>
          <div className="mt-10 grid gap-px bg-border sm:grid-cols-2">
            <div className="bg-background py-6 pr-6">
              <p className="font-display text-4xl font-bold text-primary">1993</p>
              <p className="mt-2 text-sm text-muted-foreground">год начала работы компании</p>
            </div>
            <div className="bg-background p-6">
              <p className="font-display text-4xl font-bold text-primary">4 объекта</p>
              <p className="mt-2 text-sm text-muted-foreground">
                коммерческой недвижимости в Казани
              </p>
            </div>
          </div>
          <button
            onClick={demo("Демо-режим: страница о компании появится в рабочей версии")}
            className="mt-10 border border-border px-6 py-3.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            Подробнее о компании
          </button>
        </div>
      </div>
    </section>
  );
}

/* 14. Как арендовать */
const STEPS = [
  { n: "01", title: "Выберите помещение", text: "Посмотрите доступные варианты и характеристики." },
  { n: "02", title: "Запишитесь на просмотр", text: "Оставьте заявку на удобное время." },
  {
    n: "03",
    title: "Обсудите условия",
    text: "Сотрудник компании ответит на вопросы и согласует детали.",
  },
  { n: "04", title: "Заключите договор", text: "После согласования условий оформляется аренда." },
];

export function HowTo() {
  return (
    <section className="bg-surface py-20 lg:py-28">
      <div className="container-rang">
        <SectionHead eyebrow="Процесс" title="Как арендовать помещение" />
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-border pt-6">
              <p className="font-display text-3xl font-bold text-accent">{s.n}</p>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 15. FAQ */
export function Faq({ onAskAi }: { onAskAi: () => void }) {
  return (
    <section className="container-rang py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHead eyebrow="FAQ" title="Часто задаваемые вопросы" />
          <div className="mt-8 border border-border bg-card p-6">
            <p className="text-sm font-semibold">Не нашли ответ?</p>
            <button
              onClick={onAskAi}
              className="mt-4 inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
            >
              <Bot className="size-4" />
              Спросить AI-помощника
            </button>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="border-b border-border">
              <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* Переход к существующему AI-помощнику */
export function AiTransition({ onOpen }: { onOpen: () => void }) {
  return (
    <section id="ai-assistant" className="bg-navy py-16 lg:py-20">
      <div className="container-rang flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Помощник Ранг</p>
          <h2 className="mt-3 text-3xl font-semibold text-primary-foreground sm:text-4xl">
            Поможем сориентироваться в помещениях
          </h2>
          <p className="mt-4 text-sm text-primary-foreground/70 sm:text-base">
            Демонстрационный помощник ответит на базовые вопросы о помещениях, аренде и услугах.
          </p>
        </div>
        <button
          onClick={onOpen}
          className="inline-flex w-fit items-center gap-2 bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground"
        >
          <Bot className="size-4" />
          Открыть помощника
        </button>
      </div>
    </section>
  );
}

/* 17. CTA */
export function CtaForm() {
  return (
    <section id="cta" className="bg-primary py-20 lg:py-28">
      <div className="container-rang grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <SectionHead
          eyebrow="Заявка"
          title="Не нашли подходящее помещение?"
          subtitle="Укажите необходимые параметры. Отправка заявки сотрудникам будет подключена на следующем этапе."
          tone="dark"
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            toast.info(
              "Форма пока не отправляет данные. Система заявок будет подключена на следующем этапе.",
            );
          }}
          className="bg-card p-6 shadow-card sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Имя" placeholder="Как к вам обращаться" />
            <Input label="Телефон" placeholder="+7 ___ ___ __ __" />
            <label className="block">
              <Lbl>Тип помещения</Lbl>
              <select className="h-12 w-full border border-input bg-background px-3 text-sm outline-none focus:border-accent">
                <option>Офис</option>
                <option>Склад</option>
                <option>Офис + склад</option>
                <option>Другое</option>
              </select>
            </label>
            <Input label="Желаемая площадь, м²" placeholder="Например, 120" />
            <label className="block sm:col-span-2">
              <Lbl>Комментарий</Lbl>
              <textarea
                rows={4}
                placeholder="Задачи, сроки, пожелания"
                className="w-full border border-input bg-background p-3 text-sm outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              className="h-12 bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent sm:col-span-2"
            >
              Проверить параметры
            </button>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Демонстрационная форма: данные не отправляются и не сохраняются.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
      {children}
    </span>
  );
}

function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <Lbl>{label}</Lbl>
      <input
        placeholder={placeholder}
        className="h-12 w-full border border-input bg-background px-3 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

/* 18. Контакты */
export function Contacts() {
  return (
    <section id="contacts" className="container-rang py-20 lg:py-28">
      <SectionHead eyebrow="Контакты" title="Контакты" />
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative flex min-h-72 items-center justify-center border border-border bg-surface">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <p className="relative text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Карта — заглушка
          </p>
        </div>
        <div className="grid gap-px bg-border">
          <div className="bg-background p-6">
            <p className="eyebrow">Объекты компании</p>
            <ul className="mt-3 space-y-2 text-sm">
              {OBJECTS.map((o) => (
                <li key={o.name} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span>
                    {o.name} — <span className="text-muted-foreground">{o.location}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-background p-6">
            <p className="eyebrow">Связь</p>
            <p className="mt-3 flex items-center gap-2 text-base font-semibold">
              <Phone className="size-4 text-accent" /> +7 (000) 000-00-00
            </p>
            <p className="mt-2 flex items-center gap-2 text-base font-semibold">
              <Mail className="size-4 text-accent" /> info@example.ru
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Контактные данные — заглушки, будут заменены реальными.
            </p>
          </div>
          <div className="bg-background p-6">
            <p className="eyebrow">Режим работы</p>
            <p className="mt-3 text-sm">Пн–Пт: 09:00–18:00</p>
            <p className="text-sm text-muted-foreground">Сб–Вс: по договорённости</p>
          </div>
        </div>
      </div>
    </section>
  );
}
