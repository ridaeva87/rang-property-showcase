import heroImage from "@/assets/hero-property.jpg";
import { OBJECTS, type PropertyFilters } from "@/data/rang";

export function Hero({
  filters,
  onFiltersChange,
  onSearch,
}: {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  onSearch: () => void;
}) {
  const update = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <section id="top" className="relative isolate min-h-[92vh] overflow-hidden bg-primary pt-20">
      <img
        src={heroImage}
        alt="Коммерческий объект компании «Ранг»: офисно-складской комплекс"
        width={1920}
        height={1088}
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-primary/80" />

      <div className="container-rang flex min-h-[calc(92vh-5rem)] flex-col justify-center py-16 lg:py-24">
        <div className="reveal max-w-3xl">
          <p className="text-[0.72rem] font-semibold tracking-[0.2em] text-primary-foreground/70 uppercase">
            Работаем с 1993 года
          </p>
          <h1 className="mt-6 text-4xl leading-[1.05] font-semibold text-primary-foreground sm:text-5xl lg:text-6xl">
            Коммерческие помещения для вашего бизнеса
          </h1>
          <p className="mt-6 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
            Офисы, склады и помещения различного назначения в Казани
          </p>
        </div>

        <div
          id="search"
          className="reveal mt-10 border border-primary-foreground/15 bg-card p-5 shadow-card sm:p-7 lg:mt-14"
          style={{ animationDelay: "120ms" }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
              document.querySelector("#free")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-[1fr_1.25fr_1.2fr_1fr_auto] xl:items-end"
          >
            <Field label="Тип помещения">
              <select
                value={filters.type}
                onChange={(e) => update("type", e.target.value)}
                className="h-12 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="">Все типы</option>
                <option value="Офис">Офис</option>
                <option value="Склад">Склад</option>
                <option value="Офис + склад">Офис + склад</option>
                <option value="Другое помещение">Другое помещение</option>
                <option value="Земельный участок">Земельный участок</option>
              </select>
            </Field>

            <Field label="Площадь, м²">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="От"
                  value={filters.areaFrom}
                  onChange={(e) => update("areaFrom", e.target.value)}
                  className="h-12 w-full border border-input bg-background px-3 text-sm outline-none focus:border-accent"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="number"
                  min="0"
                  placeholder="До"
                  value={filters.areaTo}
                  onChange={(e) => update("areaTo", e.target.value)}
                  className="h-12 w-full border border-input bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
            </Field>

            <Field label="Объект / адрес">
              <select
                value={filters.object}
                onChange={(e) => update("object", e.target.value)}
                className="h-12 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="">Все объекты</option>
                {OBJECTS.map((o) => (
                  <option key={o.id} value={o.id}>{`${o.name} — ${o.location}`}</option>
                ))}
              </select>
            </Field>

            <Field label="Стоимость">
              <select
                value={filters.cost}
                onChange={(e) => update("cost", e.target.value as PropertyFilters["cost"])}
                className="h-12 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="all">Любая стоимость</option>
                <option value="up-to-1000">До 1 000 ₽/м²</option>
                <option value="not-specified">Стоимость не указана</option>
              </select>
            </Field>

            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row xl:col-span-1">
              <button
                type="submit"
                className="h-12 bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
              >
                Подобрать помещение
              </button>
              <a
                href="#cta"
                className="flex h-12 items-center justify-center border border-border px-6 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Получить консультацию
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
