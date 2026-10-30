import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/rang/LegalDocumentPage";
import { PRIVACY_POLICY } from "@/data/legal";
import { loadPageSeo } from "@/lib/seo.functions";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy-policy")({
  loader: () => loadPageSeo({ data: { pageKey: "static:privacy" } }),
  head: ({ loaderData }) => buildSeoHead({ title: "Политика конфиденциальности — РАНГ", description: "Политика конфиденциальности ЗАО «РАНГ».", path: "/privacy-policy" }, loaderData),
  component: () => <LegalDocumentPage document={PRIVACY_POLICY} />,
});
