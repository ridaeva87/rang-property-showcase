import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/portal/AdminShell";
import { AUDIT_LOG_PERMISSION, auditActionLabel, auditEntityLabel } from "@/lib/audit-log";
import { loadAuditLogAdmin } from "@/lib/audit-log.functions";
import { loadAdminNavigation } from "@/lib/admin.functions";
import { getCurrentAccount } from "@/lib/portal.functions";

export const Route = createFileRoute("/admin/audit-log")({
  beforeLoad: async () => {
    const user = await getCurrentAccount();
    if (!user || user.kind !== "employee" || (!user.roles.includes("admin") && !user.permissions.includes(AUDIT_LOG_PERMISSION))) {
      throw redirect({ to: "/account/login" });
    }
  },
  loader: async () => ({ nav: await loadAdminNavigation(), entries: await loadAuditLogAdmin() }),
  component: AuditLogPage,
});

function AuditLogPage() {
  const { nav, entries } = Route.useLoaderData();
  return (
    <AdminShell title="Журнал изменений" sections={nav.sections}>
      <div className="overflow-x-auto border bg-background">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 font-semibold">Дата и время</th>
              <th className="p-3 font-semibold">Сотрудник</th>
              <th className="p-3 font-semibold">Действие</th>
              <th className="p-3 font-semibold">Сущность</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="p-3">{new Date(entry.occurredAt).toLocaleString("ru-RU")}</td>
                <td className="p-3">{entry.actor || "Система"}</td>
                <td className="p-3">{auditActionLabel(entry.action)}</td>
                <td className="p-3">{auditEntityLabel(entry.entityType)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && <p className="p-5 text-sm text-muted-foreground">Записей пока нет.</p>}
      </div>
    </AdminShell>
  );
}
