import { createFileRoute,redirect } from "@tanstack/react-router";
import { getCurrentAccount, loadRequestsAdmin } from "@/lib/portal.functions";
import { loadAdminNavigation, loadStatisticsAdmin } from "@/lib/admin.functions";
import { AdminShell } from "@/components/portal/AdminShell";
import { adminDashboardAccess, buildRequestDashboard } from "@/lib/admin-dashboard";

export const Route=createFileRoute("/admin/")({
  beforeLoad:async()=>{const u=await getCurrentAccount();if(!u||u.kind!=="employee"||!u.permissions.includes("admin.access"))throw redirect({to:"/account/login"})},
  loader:async()=>{
    const nav=await loadAdminNavigation();
    const access=adminDashboardAccess(nav.user);
    const [statistics,requestData]=await Promise.all([
      access.statistics?loadStatisticsAdmin({data:{period:"30d"}}):Promise.resolve(null),
      access.requests?loadRequestsAdmin():Promise.resolve(null),
    ]);
    return {
      nav,
      statistics:statistics?.stats??null,
      requestDashboard:requestData?buildRequestDashboard(requestData.requests,requestData.statuses):null,
    };
  },
  component:Page,
});

function Page(){
  const {nav,statistics,requestDashboard}=Route.useLoaderData();
  const metrics=[
    ...(statistics?[
      ["Помещения",statistics.premises],
      ["Опубликовано",statistics.published],
      ["Арендаторы",statistics.tenants],
    ] as const:[]),
    ...(requestDashboard?[
      ["Доступные заявки",requestDashboard.total],
      ["Открытые заявки",requestDashboard.open],
      ["Закрытые заявки",requestDashboard.closed],
    ] as const:[]),
  ];
  return <AdminShell title="Административная система" sections={nav.sections}>
    {!!metrics.length&&<section>
      <h2 className="font-display text-2xl font-bold">Основные показатели</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label,value])=><article key={label} className="border bg-background p-5"><p className="text-sm text-muted-foreground">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></article>)}</div>
    </section>}
    {requestDashboard&&<section className="mt-8">
      <div className="flex items-center justify-between gap-4"><h2 className="font-display text-2xl font-bold">Последние заявки</h2><a href="/admin/requests" className="text-sm font-medium text-primary hover:underline">Все заявки</a></div>
      <div className="mt-4 overflow-x-auto border bg-background">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead><tr>{["Номер","Дата","Статус","Ответственный"].map(label=><th key={label} className="border-b p-3">{label}</th>)}</tr></thead>
          <tbody>{requestDashboard.latest.map(request=><tr key={request.id}><td className="border-b p-3"><a href="/admin/requests" className="font-medium hover:underline">№{String(request.requestNumber).padStart(6,"0")}</a><span className="mt-1 block text-xs text-muted-foreground">{request.subject}</span></td><td className="border-b p-3">{new Date(request.createdAt).toLocaleString("ru-RU")}</td><td className="border-b p-3">{request.statusName}</td><td className="border-b p-3">{request.assignee||"Не назначен"}</td></tr>)}</tbody>
        </table>
        {!requestDashboard.latest.length&&<p className="p-5 text-sm text-muted-foreground">Доступных заявок пока нет.</p>}
      </div>
    </section>}
    <section className="mt-8"><h2 className="font-display text-2xl font-bold">Разделы</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{nav.sections.map(([href,label])=><a key={href} href={href} className="border bg-background p-5 text-lg font-semibold hover:border-primary">{label}</a>)}</div></section>
  </AdminShell>;
}
