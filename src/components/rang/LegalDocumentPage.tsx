import type { ReactNode } from "react";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import type { LegalDocument } from "@/data/legal";

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container-rang py-32 sm:py-36">
        <article className="mx-auto max-w-4xl">
          <header className="border-b border-border pb-8">
            <p className="eyebrow">ЗАО «РАНГ»</p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-5xl">{document.title}</h1>
            {document.subtitle && (
              <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {document.subtitle}
              </p>
            )}
          </header>
          <div className="mt-10 space-y-5 text-sm leading-7 text-foreground/85 sm:text-base sm:leading-8">
            {document.paragraphs.map((paragraph, index) =>
              isHeading(paragraph) ? (
                <h2 key={index} className="pt-6 text-xl font-semibold text-foreground sm:text-2xl">
                  {paragraph}
                </h2>
              ) : (
                <p key={index}>{renderInlineLinks(paragraph)}</p>
              ),
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function isHeading(value: string) {
  return /^\d+\.\s+[А-ЯЁ\s]+$/.test(value) || /^(Цели|Действия|Способы|Срок|Порядок|Передача)[^.!?]*:$/.test(value);
}

function renderInlineLinks(value: string): ReactNode[] {
  return value.split(/(https:\/\/rangpro\.ru(?:\/privacy-policy)?|noreply@rangpro\.ru)/g).map((part, index) => {
    if (part.startsWith("https://")) {
      return <a key={index} href={part} className="font-medium text-primary underline underline-offset-4">{part}</a>;
    }
    if (part === "noreply@rangpro.ru") {
      return <a key={index} href={`mailto:${part}`} className="font-medium text-primary underline underline-offset-4">{part}</a>;
    }
    return part;
  });
}
