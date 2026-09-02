import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AiAssistant } from "@/components/rang/AiAssistant";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { PropertyCard } from "@/components/rang/PropertyCard";
import { useFavorites } from "@/hooks/use-favorites";
import { loadCatalogProperties } from "@/lib/catalog.loaders";

export const Route = createFileRoute("/favorites")({
  loader: () => loadCatalogProperties({ offerType: "rent" }),
  head: () => ({
    meta: [
      { title: "Избранные помещения — Ранг" },
      { name: "description", content: "Сохранённые в этом браузере помещения компании «Ранг»." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const catalogProperties = Route.useLoaderData();
  const { favoriteIds, hydrated } = useFavorites();
  const [chatOpen, setChatOpen] = useState(false);
  const favoriteIdSet = new Set(favoriteIds);
  const properties = catalogProperties.filter((property) => favoriteIdSet.has(property.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="container-rang min-h-[65vh] py-16 lg:py-24">
          <p className="eyebrow">Избранное</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Сохранённые помещения</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Список хранится только в этом браузере. После появления авторизации его можно будет
            синхронизировать с аккаунтом.
          </p>
          {!hydrated ? (
            <p className="mt-10 text-sm text-muted-foreground">Загружаем сохранённые помещения…</p>
          ) : properties.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-border bg-card p-10">
              <h2 className="text-2xl font-semibold">В избранном пока ничего нет</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Добавляйте помещения из каталога или со страницы помещения.
              </p>
              <a
                href="/properties"
                className="mt-6 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Открыть каталог
              </a>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <AiAssistant open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
