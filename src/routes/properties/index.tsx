import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AiAssistant } from "@/components/rang/AiAssistant";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { PropertyCard } from "@/components/rang/PropertyCard";
import { PropertyFilters } from "@/components/rang/PropertyFilters";
import {
  INITIAL_PROPERTY_FILTERS,
  PROPERTY_TYPES,
  type PropertyFilters as Filters,
  type PropertyType,
} from "@/data/rang";
import { filterProperties, hasActivePropertyFilters } from "@/lib/properties";
import { loadCatalogProperties } from "@/lib/catalog.loaders";

type CatalogSearch = { type?: PropertyType };

export const Route = createFileRoute("/properties/")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    const type = search["type"];
    return typeof type === "string" && PROPERTY_TYPES.includes(type as PropertyType)
      ? { type: type as PropertyType }
      : {};
  },
  loader: () => loadCatalogProperties({ offerType: "rent" }),
  head: () => ({
    meta: [
      { title: "Каталог коммерческих помещений — Ранг" },
      {
        name: "description",
        content:
          "Свободные и скоро освобождающиеся офисы, склады и комбинированные помещения компании «Ранг» в Казани.",
      },
      { property: "og:title", content: "Каталог коммерческих помещений — Ранг" },
      {
        property: "og:description",
        content:
          "Помещения компании «Ранг» с фильтрами по площади, стоимости, объекту и характеристикам.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/properties" }],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const catalogProperties = Route.useLoaderData();
  const [filters, setFilters] = useState<Filters>({
    ...INITIAL_PROPERTY_FILTERS,
    type: search.type ?? "",
  });
  const [chatOpen, setChatOpen] = useState(false);
  const properties = filterProperties(catalogProperties, filters);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="container-rang py-16 lg:py-24">
          <p className="eyebrow">Каталог</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Коммерческие помещения</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Единый каталог доступных и скоро освобождающихся помещений компании «Ранг».
          </p>
          <div className="mt-10">
            <PropertyFilters
              filters={filters}
              properties={catalogProperties}
              onChange={setFilters}
              onReset={() => setFilters(INITIAL_PROPERTY_FILTERS)}
            />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Найдено помещений:{" "}
              <span className="font-semibold text-foreground">{properties.length}</span>
            </p>
            {hasActivePropertyFilters(filters) && (
              <button
                onClick={() => setFilters(INITIAL_PROPERTY_FILTERS)}
                className="text-sm font-semibold text-primary"
              >
                Показать весь каталог
              </button>
            )}
          </div>
          {properties.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-border bg-card p-10 text-center">
              <h2 className="text-2xl font-semibold">Подходящих помещений пока нет</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Измените параметры или сбросьте фильтры.
              </p>
              <button
                onClick={() => setFilters(INITIAL_PROPERTY_FILTERS)}
                className="mt-6 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <AiAssistant open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
