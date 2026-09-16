import { createFileRoute } from "@tanstack/react-router";
import { LegalDocumentPage } from "@/components/rang/LegalDocumentPage";
import { PERSONAL_DATA_CONSENT } from "@/data/legal";

export const Route = createFileRoute("/personal-data-consent")({
  head: () => ({
    meta: [
      { title: "Согласие на обработку персональных данных — РАНГ" },
      { name: "description", content: "Согласие на обработку персональных данных ЗАО «РАНГ»." },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/personal-data-consent" }],
  }),
  component: () => <LegalDocumentPage document={PERSONAL_DATA_CONSENT} />,
});
