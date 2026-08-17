import { toast } from "sonner";

export type PropertyInterestType = "viewing" | "application" | "release-notification" | "details";

const LABELS: Record<PropertyInterestType, string> = {
  viewing: "Запись на просмотр",
  application: "Заявка по помещению",
  "release-notification": "Интерес к освобождению помещения",
  details: "Подробности о помещении",
};

export function PropertyInterestForm({
  propertyId,
  interestType,
}: {
  propertyId: string;
  interestType: PropertyInterestType;
}) {
  return (
    <section id="property-interest" className="bg-primary py-16 lg:py-20">
      <div className="container-rang grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">{LABELS[interestType]}</p>
          <h2 className="mt-3 text-3xl font-semibold text-primary-foreground">
            Уточнить условия помещения
          </h2>
          <p className="mt-4 text-primary-foreground/70">
            Интерфейс подготовлен для будущей связи «пользователь → помещение → тип интереса →
            уведомление».
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            toast.info(
              "Форма пока не отправляет и не сохраняет данные. Система заявок будет подключена позднее.",
            );
          }}
          className="grid gap-5 bg-card p-6 sm:grid-cols-2 sm:p-8"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="interestType" value={interestType} />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Имя
            </span>
            <input name="name" placeholder="Как к вам обращаться" className="filter-control" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Телефон
            </span>
            <input name="phone" placeholder="+7 ___ ___ __ __" className="filter-control" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Комментарий
            </span>
            <textarea
              name="comment"
              rows={4}
              placeholder="Ваш вопрос или пожелание"
              className="w-full border border-input bg-background p-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="h-12 bg-primary px-6 text-sm font-semibold text-primary-foreground sm:col-span-2"
          >
            Проверить данные
          </button>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Демонстрационная форма: данные не отправляются и не сохраняются.
          </p>
        </form>
      </div>
    </section>
  );
}
