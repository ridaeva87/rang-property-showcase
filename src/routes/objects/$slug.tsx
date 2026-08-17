import { createFileRoute, notFound } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { PropertyCard } from "@/components/rang/PropertyCard";
import { getObjectBySlug, getObjectProperties } from "@/data/rang";

export const Route = createFileRoute("/objects/$slug")({
  loader: ({ params }) => {
    const object = getObjectBySlug(params.slug);
    if (!object) throw notFound();
    return object;
  },
  head: ({ loaderData: object }) => {
    if (!object) return {};
    const title = `${object.name}, ${object.address} — RANG`;
    const description = object.description ?? `Объект компании RANG по адресу ${object.address}.`;
    const canonical = `https://rangpro.ru/objects/${object.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        ...(object.photos[0] ? [{ property: "og:image", content: object.photos[0].src }] : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: ObjectPage,
});

function ObjectPage() {
  const object = Route.useLoaderData();
  const properties = getObjectProperties(object.id);
  const photo = object.photos[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="container-rang py-12 lg:py-20">
          <a href="/objects" className="text-sm font-semibold text-primary">
            ← Все объекты
          </a>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            {photo && (
              <img
                src={photo.src}
                alt={photo.alt}
                className="aspect-[16/10] size-full object-cover"
              />
            )}
            <div>
              <p className="eyebrow">Объект компании</p>
              <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{object.name}</h1>
              <p className="mt-5 flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" /> {object.address}
              </p>
              {object.description && (
                <p className="mt-6 text-foreground/75">{object.description}</p>
              )}
              {object.accessMode && (
                <p className="mt-5 text-sm">
                  <strong>Режим доступа:</strong> {object.accessMode}
                </p>
              )}
            </div>
          </div>
        </section>

        {(object.parking || object.territoryFeatures.length > 0) && (
          <section className="bg-surface py-14 lg:py-20">
            <div className="container-rang grid gap-6 lg:grid-cols-2">
              {object.parking && (
                <div className="border border-border bg-card p-6 sm:p-8">
                  <p className="eyebrow">Парковка</p>
                  <p className="mt-4 text-sm text-foreground/75">{object.parking}</p>
                </div>
              )}
              {object.territoryFeatures.length > 0 && (
                <div className="border border-border bg-card p-6 sm:p-8">
                  <p className="eyebrow">Территория</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {object.territoryFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="container-rang py-16 lg:py-24">
          <p className="eyebrow">Каталог объекта</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Помещения по этому адресу</h2>
          {properties.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <p className="mt-8 border border-border bg-card p-8 text-muted-foreground">
              В текущем каталоге помещений этого объекта пока нет.
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
