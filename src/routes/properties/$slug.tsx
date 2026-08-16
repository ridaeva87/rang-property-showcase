import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MapPin } from "lucide-react";
import { AiAssistant } from "@/components/rang/AiAssistant";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import {
  PropertyInterestForm,
  type PropertyInterestType,
} from "@/components/rang/PropertyInterestForm";
import { getPropertyBySlug } from "@/data/rang";
import { useFavorites } from "@/hooks/use-favorites";

export const Route = createFileRoute("/properties/$slug")({
  loader: ({ params }) => {
    const property = getPropertyBySlug(params.slug);
    if (!property) throw notFound();
    return property;
  },
  head: ({ loaderData: property }) => {
    if (!property) return {};
    const areaLabel =
      property.areaSqm === undefined ? "площадь уточняется" : `${property.areaSqm} м²`;
    const title = `${property.title}, ${areaLabel} — Ранг`;
    const description = `${property.type} в объекте ${property.object}, ${property.address}. Статус: ${property.status}.`;
    const canonical = `https://rangpro.ru/properties/${property.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: property.photos[0] },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: PropertyPage,
});

function PropertyPage() {
  const property = Route.useLoaderData();
  const [chatOpen, setChatOpen] = useState(false);
  const [interestType, setInterestType] = useState<PropertyInterestType>(
    property.status === "Скоро освободится" ? "release-notification" : "viewing",
  );
  const { hydrated, isFavorite, toggleFavorite } = useFavorites();
  const favorite = hydrated && isFavorite(property.id);
  const allFeatures = [...property.mainFeatures, ...property.additionalFeatures];

  const selectInterest = (type: PropertyInterestType) => {
    setInterestType(type);
    document.querySelector("#property-interest")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="container-rang py-12 lg:py-20">
          <a href="/properties" className="text-sm font-semibold text-primary">
            ← Вернуться в каталог
          </a>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="aspect-[4/3] overflow-hidden bg-surface">
              <img
                src={property.photos[0]}
                alt={`${property.title}, ${property.object}`}
                className="size-full object-cover"
              />
            </div>
            <div>
              <span className="inline-flex bg-primary px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-primary-foreground uppercase">
                {property.status}
              </span>
              <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">{property.title}</h1>
              <p className="mt-4 flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
                {property.address}
              </p>
              <dl className="mt-8 grid gap-px bg-border sm:grid-cols-2">
                {property.areaSqm !== undefined && (
                  <Detail label="Площадь" value={`${property.areaSqm} м²`} />
                )}
                <Detail label="Тип" value={property.type} />
                {property.rentPriceLabel && (
                  <Detail label="Стоимость аренды" value={property.rentPriceLabel} />
                )}
                {property.rentPricePerSqm !== undefined && (
                  <Detail label="Стоимость за м²" value={`${property.rentPricePerSqm} ₽/м²`} />
                )}
                {property.purposes.length > 0 && (
                  <Detail label="Назначение" value={property.purposes.join(", ")} />
                )}
                {property.accessMode && (
                  <Detail label="Режим доступа" value={property.accessMode} />
                )}
                {property.expectedRelease && (
                  <Detail label="Предполагаемое освобождение" value={property.expectedRelease} />
                )}
              </dl>
              {allFeatures.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold">Характеристики</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {allFeatures.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 bg-accent" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => selectInterest("viewing")}
                  className="bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
                >
                  Записаться на просмотр
                </button>
                <button
                  onClick={() =>
                    selectInterest(
                      property.status === "Скоро освободится"
                        ? "release-notification"
                        : "application",
                    )
                  }
                  className="border border-primary px-5 py-3.5 text-sm font-semibold text-primary"
                >
                  Оставить заявку
                </button>
                <button
                  onClick={() => setChatOpen(true)}
                  className="border border-border px-5 py-3.5 text-sm font-semibold"
                >
                  Задать вопрос
                </button>
                <button
                  onClick={() => toggleFavorite(property.id)}
                  aria-pressed={favorite}
                  className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3.5 text-sm font-semibold"
                >
                  <Heart className={`size-4 ${favorite ? "fill-primary text-primary" : ""}`} />
                  {favorite ? "В избранном" : "Добавить в избранное"}
                </button>
              </div>
            </div>
          </div>
        </section>
        <PropertyInterestForm propertyId={property.id} interestType={interestType} />
      </main>
      <Footer />
      <AiAssistant open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <dt className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-2 font-semibold">{value}</dd>
    </div>
  );
}
