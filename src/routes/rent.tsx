import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Clock, FileText, Search, Warehouse } from "lucide-react";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { PageIntro, RequestIntegrationNotice } from "@/components/rang/CompanySections";
import { PROPERTY_TYPES } from "@/data/rang";

const title = "Аренда коммерческих помещений — Ранг";
const description =
  "Долгосрочная и краткосрочная аренда офисов, складов и других коммерческих помещений компании «Ранг» в Казани.";

export const Route = createFileRoute("/rent")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/rent" }],
  }),
  component: RentPage,
});

const formats = [
  {
    icon: CalendarRange,
    title: "Долгосрочная аренда",
    text: "Срок и условия согласовываются для конкретного помещения.",
  },
  {
    icon: Clock,
    title: "Краткосрочная аренда",
    text: "Доступность и возможный срок уточняются у сотрудника компании.",
  },
  {
    icon: Warehouse,
    title: "Аренда части помещения",
    text: "Возможность рассматривается индивидуально для выбранного помещения.",
  },
];

const steps = [
  { icon: Search, title: "Выбор", text: "Посмотрите доступные варианты в едином каталоге." },
  {
    icon: CalendarRange,
    title: "Просмотр",
    text: "Согласуйте дату просмотра выбранного помещения.",
  },
  { icon: FileText, title: "Договор", text: "Условия обсуждаются до оформления договора аренды." },
];

function RentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <PageIntro
          eyebrow="Аренда"
          title="Помещения для задач вашего бизнеса"
          description={description}
        />

        <section className="bg-primary py-16 lg:py-24">
          <div className="container-rang grid gap-4 md:grid-cols-3">
            {formats.map((format) => (
              <article
                key={format.title}
                className="border border-primary-foreground/15 p-6 sm:p-8"
              >
                <format.icon className="size-6 text-accent" />
                <h2 className="mt-5 text-xl font-semibold text-primary-foreground">
                  {format.title}
                </h2>
                <p className="mt-3 text-sm text-primary-foreground/70">{format.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container-rang py-16 lg:py-24">
          <p className="eyebrow">Типы помещений</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Перейти к подбору в каталоге</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROPERTY_TYPES.map((type) => (
              <a
                key={type}
                href={`/properties?type=${encodeURIComponent(type)}`}
                className="border border-border bg-card p-5 font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                {type} →
              </a>
            ))}
          </div>
        </section>

        <section className="bg-surface py-16 lg:py-24">
          <div className="container-rang">
            <p className="eyebrow">Порядок аренды</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">От выбора до договора</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.title} className="border-t border-border pt-6">
                  <step.icon className="size-6 text-accent" />
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{step.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="border border-border bg-card p-6 sm:p-8">
                <h3 className="text-xl font-semibold">Условия и дополнительные расходы</h3>
                <p className="mt-4 text-sm text-muted-foreground">
                  Подтверждённые ставки и коммунальные расходы отображаются отдельно в карточке
                  помещения. Остальные условия зависят от выбранного помещения и договора.
                </p>
              </div>
              <RequestIntegrationNotice subject="Записаться на просмотр или уточнить условия" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
