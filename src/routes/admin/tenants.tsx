import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  getCurrentAccount,
  loadTenantAdmin,
  logoutAccount,
  resetTenantPassword,
  saveTenant,
  notifyTenant,
  resendTenantActivation,
} from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal/PortalShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/tenants")({
  beforeLoad: async () => {
    const u = await getCurrentAccount();
    if (!u || u.kind !== "employee" || !u.roles.includes("admin"))
      throw redirect({ to: "/account/login" });
  },
  loader: () => loadTenantAdmin(),
  component: AdminPage,
});
function AdminPage() {
  const data = Route.useLoaderData();
  const [message, setMessage] = useState("");
  const [notifying, setNotifying] = useState<(typeof data.tenants)[number] | null>(null);
  const [editing, setEditing] = useState<(typeof data.tenants)[number] | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const result = await saveTenant({
      data: {
        id: editing?.id,
        name: String(f.get("name")),
        email: String(f.get("email")),
        active: f.get("active") === "on",
        premiseIds: f.getAll("premises").map(String),
      },
    });
    if (result.emailSent === false) setMessage("Арендатор сохранён. Отправка email не настроена."); else location.reload();
  }
  return (
    <PortalShell title="Управление арендаторами">
      <div className="mb-4 flex justify-between">
        <a href="/admin/requests" className="border px-3 py-2 text-sm">
          Заявки арендаторов
        </a>
        <a href="/admin/documents" className="border px-3 py-2 text-sm">Документы</a>
        <button
          onClick={async () => {
            await logoutAccount();
            location.href = "/";
          }}
          className="border px-3 py-2 text-sm"
        >
          Выйти
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="border bg-background p-5">
          <h2 className="text-xl font-semibold">Арендаторы</h2>
          <div className="mt-4 space-y-2">
            {data.tenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 border p-3">
                <div>
                  <strong>{t.name}</strong>
                  <p className="text-sm text-muted-foreground">
                    {t.email} · {t.active ? "активен" : "отключён"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setEditing(t)} className="text-sm text-primary">
                    Изменить
                  </button>
                  <button
                    onClick={async () => { const r = await resetTenantPassword({ data: { userId: t.id } }); setMessage(r.emailSent ? "Письмо для сброса пароля отправлено." : "Отправка email не настроена."); }}
                    className="text-sm text-primary"
                  >
                    Сброс пароля
                  </button>
                  <button
                    onClick={() => setNotifying(t)}
                    className="text-sm text-primary"
                  >
                    Уведомить
                  </button>
                  {!t.activated && <button onClick={async()=>{const r=await resendTenantActivation({data:{userId:t.id}});setMessage(r.emailSent?"Письмо активации отправлено.":"Отправка email не настроена.")}} className="text-sm text-primary">Повторить активацию</button>}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="border bg-background p-5">
          <h2 className="text-xl font-semibold">{editing ? "Редактировать" : "Новый арендатор"}</h2>
          <form key={editing?.id || "new"} onSubmit={submit} className="mt-4 space-y-3">
            <input
              name="name"
              defaultValue={editing?.name}
              required
              className="w-full border px-3 py-3"
              placeholder="Имя или организация"
            />
            <input
              name="email"
              type="email"
              defaultValue={editing?.email || ""}
              required
              className="w-full border px-3 py-3"
              placeholder="Электронная почта"
            />
            <label className="flex items-center gap-2 text-sm">
              <input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />
              Доступ активен
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Помещения</legend>
              <div className="max-h-64 space-y-1 overflow-auto border p-3">
                {data.premises.map((p) => (
                  <label key={p.id} className="flex gap-2 text-sm">
                    <input
                      name="premises"
                      value={p.id}
                      type="checkbox"
                      defaultChecked={editing?.premiseIds.includes(p.id)}
                    />
                    {p.title}
                  </label>
                ))}
              </div>
            </fieldset>
            <button className="w-full bg-primary px-4 py-3 font-semibold text-primary-foreground">
              Сохранить
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-full border px-4 py-3"
              >
                Отмена
              </button>
            )}
          </form>
          {message && <p className="mt-4 border border-primary p-3 text-sm">{message}</p>}
        </section>
      </div>
      <Dialog open={!!notifying} onOpenChange={(open) => !open && setNotifying(null)}>
        <DialogContent><DialogHeader><DialogTitle>Уведомление для {notifying?.name}</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); try { await notifyTenant({ data: { userId: notifying!.id, title: String(f.get("title")), body: String(f.get("body")) } }); setMessage("Уведомление отправлено."); setNotifying(null); } catch { setMessage("Не удалось отправить уведомление."); } }} className="space-y-3">
            <input name="title" required className="w-full border px-3 py-3" placeholder="Заголовок"/><textarea name="body" required className="min-h-32 w-full border px-3 py-3" placeholder="Текст уведомления"/><DialogFooter><button type="button" onClick={() => setNotifying(null)} className="border px-4 py-2">Отмена</button><button className="bg-primary px-4 py-2 text-primary-foreground">Отправить</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}
