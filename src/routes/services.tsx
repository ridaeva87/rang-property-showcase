import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Wrench } from "lucide-react";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { PageIntro, RequestIntegrationNotice } from "@/components/rang/CompanySections";
import { ADDITIONAL_SERVICES } from "@/data/rang";
import { trackPublicAnalytics } from "@/lib/admin.functions";

const title = "Дополнительные услуги — Ранг";
const description =
  "Структура дополнительных работ для помещений RANG. Перечень, стоимость и условия уточняются компанией.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const [selectedServiceId, setSelectedServiceId] = useState<string>();
  useEffect(()=>{void trackPublicAnalytics({data:{eventType:"service_view"}})},[]);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <PageIntro
          eyebrow="Дополнительные услуги"
          title="Работы и оборудование для помещений"
          description="Раздел подготовлен для подтверждённого перечня услуг. Названия ниже задают категории; описания, цены и условия компания RANG предоставит отдельно."
        />
        <section className="bg-surface py-16 lg:py-24">
          <div className="container-rang">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ADDITIONAL_SERVICES.map((service) => (
                <article
                  key={service.id}
                  id={`service-${service.id}`}
                  className="flex min-h-48 flex-col border border-border bg-card p-6"
                >
                  <Wrench className="size-6 text-accent" />
                  <h2 className="mt-5 text-lg font-semibold">{service.title}</h2>
                  <a
                    href="#request"
                    onClick={()=>{setSelectedServiceId(service.id);void trackPublicAnalytics({data:{eventType:"service_cta",serviceId:service.id,context:{service:service.id,title:service.title}}})}}
                    className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary"
                  >
                    Оставить заявку <ArrowRight className="size-4" />
                  </a>
                </article>
              ))}
            </div>
            <div className="mt-10">
              <RequestIntegrationNotice key={selectedServiceId || "general"} source="services" serviceId={selectedServiceId} subject={selectedServiceId ? `Заявка на услугу: ${ADDITIONAL_SERVICES.find((service) => service.id === selectedServiceId)?.title || "Дополнительная услуга"}` : "Заявка на дополнительные работы"} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
