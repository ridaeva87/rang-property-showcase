import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { PropertyCard } from "@/components/rang/PropertyCard";
import { PageIntro, RequestIntegrationNotice } from "@/components/rang/CompanySections";
import { loadCatalogProperties } from "@/lib/catalog.loaders";

const title = "Недвижимость на продажу — Ранг";
const description = "Объекты недвижимости компании «Ранг», доступные для покупки в Казани.";

export const Route = createFileRoute("/sale")({
  loader: () => loadCatalogProperties({ offerType: "sale" }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/sale" }],
  }),
  component: SalePage,
});

function SalePage() {
  const saleProperties = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <PageIntro
          eyebrow="Продажа"
          title="Недвижимость на продажу"
          description="Отдельный каталог объектов, которые можно приобрести непосредственно у собственника."
        />
        <section className="bg-surface py-16 lg:py-24">
          <div className="container-rang">
            {saleProperties.length === 0 ? (
              <div className="mx-auto max-w-3xl border border-border bg-card p-8 text-center sm:p-12">
                <Building2 className="mx-auto size-10 text-accent" />
                <h2 className="mt-5 text-2xl font-semibold">Опубликованных объектов пока нет</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                  Компания ещё не предоставила подтверждённые предложения, цены и условия продажи.
                  Раздел не показывает демонстрационные объекты как реальные.
                </p>
              </div>
            ) : null}
            {saleProperties.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {saleProperties.map((property, index) => (
                  <PropertyCard key={property.id} property={property} priority={index === 0} />
                ))}
              </div>
            )}
            <div className="mx-auto mt-8 max-w-3xl">
              <RequestIntegrationNotice subject="Уточнить информацию о продаже" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
