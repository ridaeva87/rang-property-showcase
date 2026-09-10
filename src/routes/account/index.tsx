import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  loadPortal,
  logoutAccount,
  readPortalNotification,
  submitPortalRequest,
  commentPortalRequest,
} from "@/lib/portal.functions";
import { getCurrentAccount } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/account/")({
  beforeLoad: async () => {
    const user = await getCurrentAccount();
    if (!user || user.kind !== "tenant") throw redirect({ to: "/account/login" });
  },
  loader: () => loadPortal(),
  component: AccountPage,
});

const categories = [
  ["repair", "Ремонт"],
  ["electricity", "Электрика"],
  ["plumbing", "Сантехника"],
  ["refit", "Переоборудование"],
  ["access", "Доступ и пропуска"],
  ["loading", "Погрузка/разгрузка"],
  ["accounting", "Бухгалтерия"],
  ["legal", "Юридические вопросы"],
  ["documents", "Документы"],
  ["other", "Другое"],
] as const;

function AccountPage() {
  const data = Route.useLoaderData();
  const [message, setMessage] = useState("");
  async function createRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await submitPortalRequest({
        data: {
          premiseId: String(f.get("premiseId") || "") || undefined,
          category: String(f.get("category")),
          subject: String(f.get("subject")),
          description: String(f.get("description")),
        },
      });
      location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отправить заявку");
    }
  }
  return (
    <PortalShell title="Личный кабинет арендатора" name={data.user.displayName}>
      <div className="mb-6 flex flex-wrap gap-3">
        <a href="#premises" className="border bg-background px-3 py-2 text-sm">
          Мои помещения
        </a>
        <a href="#requests" className="border bg-background px-3 py-2 text-sm">
          Мои заявки
        </a>
        <a href="#documents" className="border bg-background px-3 py-2 text-sm">
          Документы
        </a>
        <button
          onClick={async () => {
            await logoutAccount();
            location.href = "/";
          }}
          className="ml-auto border px-3 py-2 text-sm"
        >
          Выйти
        </button>
      </div>
      <section id="premises" className="mb-6 border bg-background p-5">
        <h2 className="text-xl font-semibold">Мои помещения</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.premises.map((p) => (
            <div key={p.id} className="border p-4">
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.address}
                {p.area ? ` · ${Number(p.area).toLocaleString("ru-RU")} м²` : ""}
              </p>
            </div>
          ))}
          {!data.premises.length && (
            <p className="text-sm text-muted-foreground">Помещения пока не привязаны.</p>
          )}
        </div>
      </section>
      <section className="mb-6 border bg-background p-5">
        <h2 className="text-xl font-semibold">Уведомления</h2>
        <div className="mt-4 space-y-3">
          {data.notifications.map((n) => (
            <article
              key={n.id}
              className={`border p-4 ${n.readAt ? "opacity-70" : "border-primary"}`}
            >
              <div className="flex justify-between gap-3">
                <strong>{n.title}</strong>
                <time className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString("ru-RU")}
                </time>
              </div>
              <p className="mt-2 text-sm">{n.body}</p>
              {!n.readAt && (
                <button
                  className="mt-2 text-sm text-primary"
                  onClick={async () => {
                    await readPortalNotification({ data: { id: n.id } });
                    location.reload();
                  }}
                >
                  Отметить прочитанным
                </button>
              )}
            </article>
          ))}
          {!data.notifications.length && (
            <p className="text-sm text-muted-foreground">Новых уведомлений нет.</p>
          )}
        </div>
      </section>
      <section id="requests" className="mb-6 border bg-background p-5">
        <h2 className="text-xl font-semibold">Мои заявки и поддержка</h2>
        <div className="mt-4 space-y-4">
          {data.requests.map((r) => (
            <article key={r.id} className="border p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{r.subject}</strong>
                <span className="bg-muted px-2 py-1 text-xs font-semibold">{r.publicStatus}</span>
              </div>
              <p className="mt-2 text-sm">{r.description}</p>
              {r.comments.map((c) => (
                <p key={c.id} className="mt-2 border-l-2 border-primary pl-3 text-sm">
                  <span className="text-muted-foreground">{c.mine ? "Вы" : "RANG"}: </span>
                  {c.body}
                </p>
              ))}
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem("body") as HTMLInputElement;
                  await commentPortalRequest({ data: { requestId: r.id, body: input.value } });
                  location.reload();
                }}
              >
                <input
                  name="body"
                  required
                  className="min-w-0 flex-1 border px-3 py-2 text-sm"
                  placeholder="Ответить"
                />
                <button className="bg-primary px-3 text-sm text-primary-foreground">
                  Отправить
                </button>
              </form>
            </article>
          ))}
          {!data.requests.length && (
            <p className="text-sm text-muted-foreground">Заявок пока нет.</p>
          )}
        </div>
      </section>
      <section className="mb-6 border bg-background p-5">
        <h2 className="text-xl font-semibold">Подать заявку</h2>
        <form onSubmit={createRequest} className="mt-4 grid gap-3 sm:grid-cols-2">
          <select name="category" required className="border bg-background px-3 py-3">
            {categories.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select name="premiseId" className="border bg-background px-3 py-3">
            <option value="">Без привязки к помещению</option>
            {data.premises.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            name="subject"
            required
            minLength={3}
            maxLength={160}
            className="border px-3 py-3 sm:col-span-2"
            placeholder="Тема"
          />
          <textarea
            name="description"
            required
            minLength={5}
            maxLength={5000}
            className="min-h-28 border px-3 py-3 sm:col-span-2"
            placeholder="Опишите вопрос"
          />
          <button className="bg-primary px-4 py-3 font-semibold text-primary-foreground sm:col-span-2">
            Отправить заявку
          </button>
          {message && <p className="text-sm text-destructive sm:col-span-2">{message}</p>}
        </form>
      </section>
      <section id="documents" className="border bg-background p-5">
        <h2 className="text-xl font-semibold">Документы</h2>
        <div className="mt-4 space-y-2">
          {data.documents.map((d) => (
            <a
              key={d.id}
              href={`/account/documents/${d.id}`}
              className="flex justify-between border p-3 text-sm hover:border-primary"
            >
              <span>{d.title}</span>
              <span className="text-muted-foreground">{d.type}</span>
            </a>
          ))}
          {!data.documents.length && (
            <p className="text-sm text-muted-foreground">Документы пока не опубликованы.</p>
          )}
        </div>
      </section>
    </PortalShell>
  );
}
