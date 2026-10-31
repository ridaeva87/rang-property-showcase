import { createFileRoute, redirect } from "@tanstack/react-router";
import { SeoAdminPage } from "@/components/portal/SeoAdminPage";
import { loadAdminNavigation } from "@/lib/admin.functions";
import { SEO_MANAGE_PERMISSION } from "@/lib/seo";
import { loadSeoAdmin } from "@/lib/seo.functions";
import { getCurrentAccount } from "@/lib/portal.functions";

export const Route = createFileRoute("/admin/seo")({
  beforeLoad: async () => {
    const user = await getCurrentAccount();
    if (!user || user.kind !== "employee" || (!user.roles.includes("admin") && !user.permissions.includes(SEO_MANAGE_PERMISSION))) {
      throw redirect({ to: "/account/login" });
    }
  },
  loader: async () => ({ nav: await loadAdminNavigation(), pages: await loadSeoAdmin() }),
  component: SeoAdminRoute,
});

function SeoAdminRoute() {
  const data = Route.useLoaderData();
  return <SeoAdminPage nav={data.nav.sections} pages={data.pages} />;
}
