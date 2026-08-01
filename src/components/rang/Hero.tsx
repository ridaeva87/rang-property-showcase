import { toast } from "sonner";
import heroImage from "@/assets/hero-property.jpg";
import { OBJECTS } from "@/data/rang";

export function Hero() {
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
              toast.success("Демо-режим: подбор помещений появится в рабочей версии сайта");
            }}
            className="grid gap-5 lg:grid-cols-[1.1fr_1.3fr_1.2fr_auto] lg:items-end"
          >
            <Field label="Тип помещения">
              <select className="h-12 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent">
                <option>Офис</option>
                <option>Склад</option>
                <option>Офис + склад</option>
                <option>Другое</option>
              </select>
            </Field>

            <Field label="Площадь, м²">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="От"
                  className="h-12 w-full border border-input bg-background px-3 text-sm outline-none focus:border-accent"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="number"
                  placeholder="До"
                  className="h-12 w-full border border-input bg-background px-3 text-sm outline-none focus:border-accent"
                />
              </div>
            </Field>

            <Field label="Объект / адрес">
              <select className="h-12 w-full border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-accent">
                <option>Все объекты</option>
                {OBJECTS.map((o) => (
                  <option key={o.name}>{o.name}</option>
                ))}
              </select>
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row lg:pb-0">
              <button
                type="submit"
                className="h-12 bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
              >
                Показать помещения
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
