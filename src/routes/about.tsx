import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { HistoricalLicense, PageIntro } from "@/components/rang/CompanySections";

const title = "История компании RANG — с 1993 года";
const description = "История компании RANG, архивные материалы и историческая лицензия 1994 года.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <PageIntro
          eyebrow="О компании"
          title="RANG работает с бизнесом с 1993 года"
          description="Раздел объединяет только подтверждённые сведения и оригинальные исторические материалы компании. Новые этапы истории будут добавляться по мере предоставления документов и архивных фотографий."
        />
        <section className="container-rang pb-16 lg:pb-24">
          <div className="grid gap-px bg-border sm:grid-cols-2">
            <div className="bg-card p-6 sm:p-8">
              <p className="font-display text-5xl font-bold text-primary">1993</p>
              <p className="mt-3 text-sm text-muted-foreground">год начала работы компании</p>
            </div>
            <div className="bg-card p-6 sm:p-8">
              <p className="font-display text-5xl font-bold text-primary">1994</p>
              <p className="mt-3 text-sm text-muted-foreground">
                год предоставленного исторического документа
              </p>
            </div>
          </div>
        </section>
        <HistoricalLicense />
      </main>
      <Footer />
    </div>
  );
}
