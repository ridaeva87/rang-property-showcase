import { useState, type FormEvent } from "react";
import { AdminShell } from "./AdminShell";
import { moveFaq, saveFaq } from "@/lib/faq.functions";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  publicationStatus: "draft" | "published" | "archived";
};

export function FaqAdminPage({
  nav,
  items,
}: {
  nav: readonly (readonly [string, string, string])[];
  items: FaqItem[];
}) {
  const [editing, setEditing] = useState<FaqItem | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await saveFaq({
      data: {
        id: editing?.id,
        question: String(form.get("question") || ""),
        answer: String(form.get("answer") || ""),
        category: String(form.get("category") || ""),
        publicationStatus: String(form.get("publicationStatus") || "draft") as FaqItem["publicationStatus"],
      },
    });
    location.reload();
  }

  async function changeOrder(item: FaqItem, direction: "up" | "down") {
    await moveFaq({ data: { id: item.id, direction } });
    location.reload();
  }

  return (
    <AdminShell title="FAQ" sections={nav}>
      <form key={editing?.id || "new"} onSubmit={submit} className="mb-6 grid gap-3 border bg-background p-5">
        <input name="category" required defaultValue={editing?.category || ""} placeholder="Категория" className="border p-3" />
        <input name="question" required defaultValue={editing?.question || ""} placeholder="Вопрос" className="border p-3" />
        <textarea name="answer" required defaultValue={editing?.answer || ""} placeholder="Ответ" className="min-h-32 border p-3" />
        <select name="publicationStatus" defaultValue={editing?.publicationStatus || "draft"} className="border p-3">
          <option value="draft">Черновик</option>
          <option value="published">Опубликовано</option>
          <option value="archived">Снято с публикации</option>
        </select>
        <div className="flex gap-2">
          <button className="bg-primary p-3 text-primary-foreground">{editing ? "Сохранить" : "Добавить"}</button>
          {editing && <button type="button" onClick={() => setEditing(null)} className="border p-3">Отмена</button>}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((item, index) => (
          <article key={item.id} className="border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{item.category} · {item.publicationStatus === "published" ? "Опубликовано" : item.publicationStatus === "archived" ? "Снято" : "Черновик"}</p>
                <h2 className="font-semibold">{item.question}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.answer}</p>
              </div>
              <div className="flex gap-2">
                <button disabled={index === 0} onClick={() => changeOrder(item, "up")} className="border px-2 py-1 text-sm disabled:opacity-40" aria-label="Поднять вопрос">↑</button>
                <button disabled={index === items.length - 1} onClick={() => changeOrder(item, "down")} className="border px-2 py-1 text-sm disabled:opacity-40" aria-label="Опустить вопрос">↓</button>
                <button onClick={() => { setEditing(item); scrollTo({ top: 0, behavior: "smooth" }); }} className="text-sm text-primary">Изменить</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
