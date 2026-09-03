import { useState } from "react";
import { Building2, Play } from "lucide-react";
import type { Property } from "@/data/rang";
import { ResponsiveImage } from "./ResponsiveImage";

export function PropertyGallery({ property }: { property: Property }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = property.photos[activeIndex] ?? property.photos[0];

  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden bg-surface">
        {activePhoto ? (
          <ResponsiveImage
            photo={activePhoto}
            sizes="(max-width: 1023px) 100vw, 58vw"
            priority
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-4 px-8 text-center text-muted-foreground">
            <Building2 className="size-12 text-accent" />
            <div>
              <p className="font-semibold text-foreground">Фото готовятся</p>
              <p className="mt-2 text-sm">Здесь появится галерея именно этого помещения.</p>
            </div>
          </div>
        )}
      </div>

      {property.photos.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5" aria-label="Галерея помещения">
          {property.photos.map((photo, index) => (
            <button
              key={`${photo.src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Показать фотографию ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`aspect-[4/3] overflow-hidden border-2 ${
                index === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <ResponsiveImage
                photo={{ ...photo, alt: "" }}
                sizes="20vw"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {property.video && (
        <section className="mt-8" aria-labelledby="property-video-title">
          <div className="mb-4 flex items-center gap-3">
            <Play className="size-5 text-accent" />
            <h2 id="property-video-title" className="text-xl font-semibold">
              {property.video.title}
            </h2>
          </div>
          {property.video.kind === "embed" ? (
            <div className="aspect-video overflow-hidden bg-graphite">
              <iframe
                src={property.video.url}
                title={property.video.title}
                loading="lazy"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            </div>
          ) : (
            <video
              controls
              preload="metadata"
              poster={property.video.poster}
              className="aspect-video w-full bg-graphite"
            >
              <source src={property.video.url} />
            </video>
          )}
        </section>
      )}
    </div>
  );
}
