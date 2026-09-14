import { createFileRoute,redirect } from "@tanstack/react-router";
import { getCurrentAccount } from "@/lib/portal.functions";
import { loadAdminNavigation } from "@/lib/admin.functions";
import { AdminShell } from "@/components/portal/AdminShell";
export const Route=createFileRoute("/admin/")({beforeLoad:async()=>{const u=await getCurrentAccount();if(!u||u.kind!=="employee"||!u.permissions.includes("admin.access"))throw redirect({to:"/account/login"})},loader:()=>loadAdminNavigation(),component:Page});
function Page(){const d=Route.useLoaderData();return <AdminShell title="Административная система" sections={d.sections}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{d.sections.map(([href,label])=><a key={href} href={href} className="border bg-background p-5 text-lg font-semibold hover:border-primary">{label}</a>)}</div></AdminShell>}
