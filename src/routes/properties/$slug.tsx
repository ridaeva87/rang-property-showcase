import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MapPin } from "lucide-react";
import { AiAssistant } from "@/components/rang/AiAssistant";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { PropertyDetails } from "@/components/rang/PropertyDetails";
import { PropertyGallery } from "@/components/rang/PropertyGallery";
import {
  PropertyInterestForm,
  type PropertyInterestType,
} from "@/components/rang/PropertyInterestForm";
import { getPropertyBySlug, getPropertyObject } from "@/data/rang";
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
    const object = getPropertyObject(property);
    const title = `${property.title}, ${areaLabel} — Ранг`;
    const statusLabel = property.status ? ` Статус аренды: ${property.status}.` : "";
    const description = `${property.type}${object ? ` в объекте ${object.name}, ${object.address}` : ""}.${statusLabel}`;
    const canonical = `https://rangpro.ru/properties/${property.slug}`;
    const mainPhoto = property.photos[0];
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        ...(mainPhoto ? [{ property: "og:image", content: mainPhoto.src }] : []),
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
  const object = getPropertyObject(property);

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
            <PropertyGallery property={property} />
            <div>
              {property.status && (
                <span className="inline-flex bg-primary px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-primary-foreground uppercase">
                  {property.status}
                </span>
              )}
              <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">{property.title}</h1>
              <p className="mt-4 flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
                {object?.address ?? "Адрес уточняется"}
              </p>
              <dl className="mt-8 grid gap-3 sm:grid-cols-2">
                {property.areaSqm !== undefined && (
                  <Detail label="Площадь" value={`${property.areaSqm} м²`} />
                )}
                <Detail label="Тип" value={property.type} />
                {property.rentPricePerSqm !== undefined && (
                  <Detail label="Ставка аренды" value={`${property.rentPricePerSqm} ₽/м²`} />
                )}
                {property.totalMonthlyRent !== undefined && (
                  <Detail label="Полная стоимость" value={`${property.totalMonthlyRent} ₽/месяц`} />
                )}
                {property.status === "Скоро освободится" && property.expectedRelease && (
                  <Detail label="Предполагаемое освобождение" value={property.expectedRelease} />
                )}
              </dl>
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
                  onClick={() => selectInterest("details")}
                  className="border border-border px-5 py-3.5 text-sm font-semibold"
                >
                  Узнать подробности
                </button>
                <button
                  onClick={() => toggleFavorite(property.id)}
                  aria-pressed={favorite}
                  className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3.5 text-sm font-semibold sm:col-span-2"
                >
                  <Heart className={`size-4 ${favorite ? "fill-primary text-primary" : ""}`} />
                  {favorite ? "В избранном" : "Добавить в избранное"}
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-surface py-16 lg:py-24">
          <div className="container-rang">
            <PropertyDetails property={property} />
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
    <div className="border border-border bg-card p-5">
      <dt className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-2 font-semibold">{value}</dd>
    </div>
  );
}
