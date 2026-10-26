import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { getCurrentAccount, loadDocumentsAdmin, deactivateDocument } from "@/lib/portal.functions";
import { loadAdminNavigation } from "@/lib/admin.functions";
import { AdminShell } from "@/components/portal/AdminShell";

export const Route = createFileRoute("/admin/documents")({
  beforeLoad: async () => {
    const user = await getCurrentAccount();
    if (!user || user.kind !== "employee" || !user.permissions.includes("documents.manage"))
      throw redirect({ to: "/account/login" });
  },
  loader: async () => ({ data: await loadDocumentsAdmin(), nav: await loadAdminNavigation() }),
  component: Page,
});

function Page() {
  const { data, nav } = Route.useLoaderData();
  const [targetKind, setTargetKind] = useState<"tenant" | "object" | "premise">("tenant");
  const targets =
    targetKind === "tenant"
      ? data.tenants.map((item) => ({ id: item.id, label: item.name }))
      : targetKind === "object"
        ? data.objects.map((item) => ({ id: item.id, label: item.name }))
        : data.premises.map((item) => ({ id: item.id, label: `${item.object} · ${item.name}` }));
  return (
    <AdminShell title="Документы" sections={nav.sections}>
      <a href="/admin/tenants" className="mb-4 inline-block border px-3 py-2 text-sm">
        Арендаторы
      </a>
      <form
        method="post"
        action="/admin/documents/upload"
        encType="multipart/form-data"
        className="grid gap-3 border bg-background p-5 md:grid-cols-2"
      >
        <select
          name="targetKind"
          value={targetKind}
          onChange={(event) => setTargetKind(event.target.value as typeof targetKind)}
          className="border px-3 py-3"
        >
          <option value="tenant">Арендатор</option>
          <option value="object">Объект</option>
          <option value="premise">Помещение</option>
        </select>
        <select key={targetKind} name="targetId" required className="border px-3 py-3">
          <option value="">Выберите получателя</option>
          {targets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.label}
            </option>
          ))}
        </select>
        <select name="type" required className="border px-3 py-3">
          {data.types.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
        <input name="title" required className="border px-3 py-3" placeholder="Название документа" />
        <input name="date" type="date" className="border px-3 py-3" />
        <input name="file" type="file" required className="border px-3 py-3" />
        <button className="bg-primary px-4 py-3 text-primary-foreground md:col-span-2">
          Загрузить
        </button>
      </form>
      <div className="mt-5 space-y-2">
        {data.documents.map((document) => {
          const target = document.tenant
            ? `Арендатор: ${document.tenant}`
            : document.premise
              ? `Помещение: ${document.premise}`
              : document.object
                ? `Объект: ${document.object}`
                : "Без получателя";
          return (
            <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 border p-3">
              <div>
                <strong>{document.title}</strong>
                <p className="text-sm text-muted-foreground">
                  {target} · {document.type}
                  {document.date ? ` · ${document.date}` : ""} · {document.active ? "Активен" : "Отключён"}
                </p>
              </div>
              <div className="flex gap-3">
                <a href={`/account/documents/${document.id}`} target="_blank" rel="noreferrer" className="text-primary">
                  Открыть
                </a>
                {document.active && (
                  <button
                    className="text-destructive"
                    onClick={async () => {
                      await deactivateDocument({ data: { id: document.id } });
                      location.reload();
                    }}
                  >
                    Деактивировать
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
