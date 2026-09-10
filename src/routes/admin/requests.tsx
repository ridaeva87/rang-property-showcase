import { createFileRoute, redirect } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { getCurrentAccount, loadRequestsAdmin, updateRequest } from "@/lib/portal.functions";
import { PortalShell } from "@/components/portal/PortalShell";

export const Route = createFileRoute("/admin/requests")({
  beforeLoad: async () => {
    const user = await getCurrentAccount();
    if (!user || user.kind !== "employee" || !user.roles.includes("admin"))
      throw redirect({ to: "/account/login" });
  },
  loader: () => loadRequestsAdmin(),
  component: RequestsAdminPage,
});

function RequestsAdminPage() {
  const requests = Route.useLoaderData();
  async function submit(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const comment = String(form.get("comment") || "");
    await updateRequest({
      data: {
        requestId,
        status: String(form.get("status")) as "accepted" | "in_progress" | "completed",
        visibility: String(form.get("visibility")) as "public" | "internal",
        ...(comment ? { comment } : {}),
      },
    });
    location.reload();
  }
  return (
    <PortalShell title="Заявки арендаторов">
      <a href="/admin/tenants" className="mb-4 inline-block border px-3 py-2 text-sm">
        Арендаторы
      </a>
      <div className="space-y-4">
        {requests.map((request) => (
          <article key={request.id} className="border bg-background p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{request.subject}</h2>
                <p className="text-sm text-muted-foreground">
                  {request.tenant || "Без автора"}
                  {request.premise ? ` · ${request.premise}` : ""}
                </p>
              </div>
              <time className="text-xs text-muted-foreground">
                {new Date(request.createdAt).toLocaleString("ru-RU")}
              </time>
            </div>
            <p className="mt-3 text-sm">{request.description}</p>
            {request.comments.map((comment) => (
              <p key={comment.id} className="mt-2 border-l-2 pl-3 text-sm">
                <span className="text-muted-foreground">
                  {comment.visibility === "internal" ? "Внутренний комментарий: " : "Ответ: "}
                </span>
                {comment.body}
              </p>
            ))}
            <form
              onSubmit={(event) => submit(event, request.id)}
              className="mt-4 grid gap-2 sm:grid-cols-[180px_160px_1fr_auto]"
            >
              <select
                name="status"
                defaultValue={request.status}
                className="border bg-background px-3 py-2"
              >
                <option value="accepted">Принято</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Выполнено</option>
              </select>
              <select name="visibility" className="border bg-background px-3 py-2">
                <option value="public">Ответ арендатору</option>
                <option value="internal">Внутренний</option>
              </select>
              <input
                name="comment"
                className="border px-3 py-2"
                placeholder="Комментарий (необязательно)"
              />
              <button className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Сохранить
              </button>
            </form>
          </article>
        ))}
        {!requests.length && (
          <p className="border bg-background p-5 text-sm text-muted-foreground">Заявок пока нет.</p>
        )}
      </div>
    </PortalShell>
  );
}
