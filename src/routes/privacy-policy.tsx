import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/rang/LegalDocumentPage";
import { PRIVACY_POLICY } from "@/data/legal";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — РАНГ" },
      { name: "description", content: "Политика конфиденциальности ЗАО «РАНГ»." },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/privacy-policy" }],
  }),
  component: () => <LegalDocumentPage document={PRIVACY_POLICY} />,
});
