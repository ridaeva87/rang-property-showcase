import { createFileRoute } from "@tanstack/react-router";
import { SeoAdminPage } from "@/components/portal/SeoAdminPage";
import { loadAdminNavigation } from "@/lib/admin.functions";
import { loadSeoAdmin } from "@/lib/seo.functions";

export const Route = createFileRoute("/admin/seo")({
  loader: async () => ({ nav: await loadAdminNavigation(), pages: await loadSeoAdmin() }),
  component: SeoAdminRoute,
});

function SeoAdminRoute() {
  const data = Route.useLoaderData();
  return <SeoAdminPage nav={data.nav.sections} pages={data.pages} />;
}
