import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { COMPANY_DOCUMENTS, type PropertyObject } from "@/data/rang";
import { ResponsiveImage } from "./ResponsiveImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="container-rang py-14 sm:py-16 lg:py-24">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold sm:text-5xl lg:text-6xl">{title}</h1>
      <p className="mt-6 max-w-3xl text-base text-muted-foreground sm:text-lg">{description}</p>
    </section>
  );
}

export function ObjectCard({
  object,
  propertyCount,
}: {
  object: PropertyObject;
  propertyCount: number;
}) {
  const photo = object.photos[0];

  return (
    <article className="card-lift flex h-full flex-col border border-border bg-card">
      {photo && (
        <div className="aspect-[16/9] overflow-hidden">
          <ResponsiveImage
            photo={photo}
            sizes="(max-width: 767px) 100vw, 50vw"
            className="size-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">{object.name}</h2>
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
          {object.address}
        </p>
        {object.description && (
          <p className="mt-5 text-sm text-foreground/75">{object.description}</p>
        )}
        <p className="mt-5 text-sm text-muted-foreground">
          Помещений в текущем каталоге:{" "}
          <span className="font-semibold text-foreground">{propertyCount}</span>
        </p>
        <a
          href={`/objects/${object.slug}`}
          className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary"
        >
          Подробнее <ArrowRight className="size-4" />
        </a>
      </div>
    </article>
  );
}

export function ObjectsMapPlaceholder({ objects }: { objects: PropertyObject[] }) {
  const hasCoordinates = objects.some((object) => object.coordinates !== undefined);

  return (
    <section className="bg-surface py-16 lg:py-24">
      <div className="container-rang">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="eyebrow">Карта объектов</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Расположение объектов RANG</h2>
            <p className="mt-5 text-muted-foreground">
              Адреса подтверждены. Координаты и картографический сервис пока не предоставлены,
              поэтому интерактивная карта не подключена.
            </p>
          </div>
          <div className="relative min-h-80 overflow-hidden border border-border bg-background p-6 sm:p-8">
            <div
              className="absolute inset-0 opacity-60"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative grid gap-3 sm:grid-cols-2">
              {objects.map((object) => (
                <a
                  key={object.id}
                  href={`/objects/${object.slug}`}
                  className="flex gap-3 border border-border bg-card p-4 text-sm transition-colors hover:border-primary"
                >
                  <MapPin className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span>
                    <strong className="block text-foreground">{object.name}</strong>
                    <span className="mt-1 block text-muted-foreground">{object.address}</span>
                  </span>
                </a>
              ))}
            </div>
            {!hasCoordinates && (
              <p className="relative mt-6 text-xs text-muted-foreground">
                Маркеры появятся после получения координат и выбора картографического сервиса.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HistoricalLicense() {
  const document = COMPANY_DOCUMENTS[0];

  return (
    <section className="bg-surface py-16 lg:py-24">
      <div className="container-rang grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
        <Dialog>
          <DialogTrigger asChild>
            <button className="group overflow-hidden border border-border bg-card text-left shadow-card">
              <img
                src={document.previewUrl}
                alt="Превью исторической лицензии компании «Ранг» от 7 июля 1994 года"
                className="w-full transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 text-sm font-semibold">
                Открыть увеличенное изображение
                <ExternalLink className="size-4 text-accent" />
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-h-[92vh] max-w-[96vw] overflow-auto border-border bg-background p-3 sm:max-w-6xl sm:p-5">
            <DialogTitle>{document.title}</DialogTitle>
            <DialogDescription>
              Оригинальный исторический документ, предоставленный компанией RANG.
            </DialogDescription>
            <img
              src={document.previewUrl}
              alt="Историческая лицензия компании «Ранг» от 7 июля 1994 года"
              className="h-auto w-full"
            />
          </DialogContent>
        </Dialog>

        <div>
          <p className="eyebrow">Архив компании</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Лицензия от 07.07.1994</h2>
          <p className="mt-5 text-muted-foreground">
            Оригинальный скан документа представлен как часть истории компании. Размещение в архиве
            не является заявлением о действии лицензии в настоящее время.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
            >
              Открыть полный PDF <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RequestIntegrationNotice({ subject }: { subject: string }) {
  return (
    <div id="request" className="border border-border bg-card p-6 sm:p-8">
      <p className="eyebrow">Заявка</p>
      <h2 className="mt-3 text-2xl font-semibold">{subject}</h2>
      <p className="mt-4 text-sm text-muted-foreground">
        Онлайн-отправка и сохранение заявок будут подключены вместе с единой системой заявок RANG.
        На этом этапе форма не имитирует отправку данных.
      </p>
    </div>
  );
}
