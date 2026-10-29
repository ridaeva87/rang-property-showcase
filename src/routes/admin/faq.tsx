import { createFileRoute } from "@tanstack/react-router";
import { FaqAdminPage } from "@/components/portal/FaqAdminPage";
import { loadAdminNavigation } from "@/lib/admin.functions";
import { loadFaqAdmin } from "@/lib/faq.functions";

export const Route = createFileRoute("/admin/faq")({
  loader: async () => ({ nav: await loadAdminNavigation(), items: await loadFaqAdmin() }),
  component: FaqAdminRoute,
});

function FaqAdminRoute() {
  const data = Route.useLoaderData();
  return <FaqAdminPage nav={data.nav.sections} items={data.items} />;
}
