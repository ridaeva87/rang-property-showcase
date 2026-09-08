import { Link } from "@tanstack/react-router";
import { Building2, Heart, MapPin } from "lucide-react";
import { getPropertyObject, type Property } from "@/data/rang";
import { useFavorites } from "@/hooks/use-favorites";
import { ResponsiveImage } from "./ResponsiveImage";

export function PropertyCard({
  property,
  dark = false,
  priority = false,
}: {
  property: Property;
  dark?: boolean;
  priority?: boolean;
}) {
  const { hydrated, isFavorite, toggleFavorite } = useFavorites();
  const favorite = hydrated && isFavorite(property.id);
  const object = getPropertyObject(property);
  const mainPhoto = property.photos[0];
  const isSale = property.offerType === "sale";

  return (
    <article
      className={`card-lift media-zoom flex h-full flex-col ${
        dark ? "border border-primary-foreground/12 bg-primary-foreground/5" : "bg-card shadow-card"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {mainPhoto ? (
          <ResponsiveImage
            photo={mainPhoto}
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            priority={priority}
            className={`size-full ${mainPhoto.role === "floor-plan" ? "object-contain p-3" : "object-cover"} ${dark ? "opacity-85" : ""}`}
          />
        ) : (
          <div
            className={`flex size-full flex-col items-center justify-center gap-3 px-6 text-center ${
              dark
                ? "bg-primary-foreground/5 text-primary-foreground/60"
                : "bg-surface text-muted-foreground"
            }`}
          >
            <Building2 className="size-9 text-accent" />
            <span className="text-sm">Фото готовятся</span>
          </div>
        )}
        {(isSale || property.status) && (
          <span
            className={`absolute top-4 left-4 px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.08em] uppercase ${
              dark
                ? "border border-accent/60 bg-graphite text-accent"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isSale ? "Продажа" : property.status}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleFavorite(property.id)}
          aria-label={favorite ? "Удалить из избранного" : "Добавить в избранное"}
          aria-pressed={favorite}
          className="absolute top-4 right-4 flex size-10 items-center justify-center bg-card text-primary shadow-card"
        >
          <Heart className={`size-5 ${favorite ? "fill-primary" : ""}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className={`text-xl font-semibold ${dark ? "text-primary-foreground" : ""}`}>
          {property.title}
        </h3>
        <p
          className={`mt-2 flex items-start gap-2 text-sm ${
            dark ? "text-primary-foreground/65" : "text-muted-foreground"
          }`}
        >
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
          {property.objectAddress ?? object?.address ?? "Адрес уточняется"}
        </p>
        {property.expectedRelease && (
          <p className={`mt-3 text-sm font-semibold ${dark ? "text-accent" : "text-primary"}`}>
            Освобождение: {property.expectedRelease}
          </p>
        )}
        <div
          className={`mt-5 flex items-baseline justify-between border-y py-4 ${
            dark ? "border-primary-foreground/12" : "border-border"
          }`}
        >
          <span className={`text-lg font-semibold ${dark ? "text-primary-foreground" : ""}`}>
            {property.areaSqm !== undefined ? `${property.areaSqm} м²` : "Площадь уточняется"}
          </span>
          {isSale && property.salePrice !== undefined ? (
            <span className="text-sm font-semibold text-primary">
              {formatNumber(property.salePrice)} ₽
            </span>
          ) : property.rentPricePerSqmLabel || property.rentPricePerSqm !== undefined ? (
            <span className="text-sm text-accent">
              {property.rentPricePerSqmLabel ?? property.rentPricePerSqm} ₽/м²
            </span>
          ) : null}
        </div>
        {isSale && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {property.floor && <span>{property.floor} этаж</span>}
            {property.pricePerSqm && <span>{formatNumber(property.pricePerSqm)} ₽/м²</span>}
          </div>
        )}
        {property.mainFeatures.length > 0 && (
          <ul
            className={`mt-5 space-y-2 text-sm ${
              dark ? "text-primary-foreground/65" : "text-muted-foreground"
            }`}
          >
            {property.mainFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-2 size-1.5 shrink-0 bg-accent" />
                {feature}
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/properties/$slug"
          params={{ slug: property.slug }}
          className={`mt-6 flex w-full items-center justify-center py-3 text-sm font-semibold ${
            dark
              ? "bg-accent text-accent-foreground"
              : "border border-border transition-colors hover:border-primary hover:text-primary"
          }`}
        >
          Подробнее
        </Link>
      </div>
    </article>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}
