import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/rang/Footer";
import { Header } from "@/components/rang/Header";
import { ObjectCard, ObjectsMapPlaceholder, PageIntro } from "@/components/rang/CompanySections";
import { OBJECTS } from "@/data/rang";

const title = "Объекты компании RANG — Казань";
const description =
  "Объекты коммерческой недвижимости компании RANG и помещения внутри каждого объекта.";

export const Route = createFileRoute("/objects/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://rangpro.ru/objects" }],
  }),
  component: ObjectsPage,
});

function ObjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <PageIntro
          eyebrow="Объекты компании"
          title="Площадки RANG в Казани"
          description="Объект хранит общие сведения об адресе и территории, а помещения связаны с ним через единый каталог без дублирования данных."
        />
        <section className="container-rang pb-16 lg:pb-24">
          <div className="grid gap-6 md:grid-cols-2">
            {OBJECTS.map((object) => (
              <ObjectCard key={object.id} object={object} />
            ))}
          </div>
        </section>
        <ObjectsMapPlaceholder />
      </main>
      <Footer />
    </div>
  );
}
