import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { sendPropertyInterest } from "@/lib/admin.functions";

export type PropertyInterestType = "viewing" | "application" | "release-notification" | "details";

const LABELS: Record<PropertyInterestType, string> = {
  viewing: "Запись на просмотр",
  application: "Заявка по помещению",
  "release-notification": "Интерес к освобождению помещения",
  details: "Подробности о помещении",
};

export function PropertyInterestForm({
  propertyId,
  objectId,
  interestType,
}: {
  propertyId: string;
  objectId: string;
  interestType: PropertyInterestType;
}) {
  const [sending, setSending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    try {
      await sendPropertyInterest({ data: { premiseId: propertyId, objectId, type: interestType, name: String(data.get("name") || ""), phone: String(data.get("phone") || ""), message: String(data.get("comment") || "") } });
      form.reset();
      toast.success(interestType === "details" ? "Запрос отправлен" : "Заявка отправлена");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить заявку");
    } finally { setSending(false); }
  }
  return (
    <section id="property-interest" className="bg-primary py-16 lg:py-20">
      <div className="container-rang grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">{LABELS[interestType]}</p>
          <h2 className="mt-3 text-3xl font-semibold text-primary-foreground">
            Уточнить условия помещения
          </h2>
          <p className="mt-4 text-primary-foreground/70">Оставьте контакты — сотрудник RANG свяжется с вами по выбранному помещению.</p>
        </div>
        <form
          onSubmit={submit}
          className="grid gap-5 bg-card p-6 sm:grid-cols-2 sm:p-8"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="interestType" value={interestType} />
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Имя
            </span>
            <input name="name" required minLength={2} placeholder="Как к вам обращаться" className="filter-control" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Телефон
            </span>
            <input name="phone" required minLength={6} placeholder="+7 ___ ___ __ __" className="filter-control" />
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
            {sending ? "Отправляем…" : interestType === "details" ? "Отправить запрос" : "Отправить заявку"}
          </button>
        </form>
      </div>
    </section>
  );
}
