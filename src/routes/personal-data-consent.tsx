import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/rang/LegalDocumentPage";
import { PERSONAL_DATA_CONSENT } from "@/data/legal";
import { loadPageSeo } from "@/lib/seo.functions";
import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/personal-data-consent")({
  loader: () => loadPageSeo({ data: { pageKey: "static:personal-data-consent" } }),
  head: ({ loaderData }) => buildSeoHead({ title: "Согласие на обработку персональных данных — РАНГ", description: "Согласие на обработку персональных данных ЗАО «РАНГ».", path: "/personal-data-consent" }, loaderData),
  component: () => <LegalDocumentPage document={PERSONAL_DATA_CONSENT} />,
});
