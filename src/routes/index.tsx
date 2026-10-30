import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { INITIAL_PROPERTY_FILTERS, type PropertyFilters } from "@/data/rang";
import { Header } from "@/components/rang/Header";
import { Hero } from "@/components/rang/Hero";
import {
  About,
  ComingSoon,
  Contacts,
  CtaForm,
  Faq,
  AiTransition,
  FreePremises,
  HowTo,
  Objects,
  PremiseTypes,
  RentSection,
  SaleSection,
  Services,
  Tenants,
  Videos,
} from "@/components/rang/Sections";
import { Footer } from "@/components/rang/Footer";
import { AiAssistant } from "@/components/rang/AiAssistant";
import { loadCatalogObjects, loadCatalogProperties } from "@/lib/catalog.loaders";
import { loadPublicFaq } from "@/lib/faq.functions";
import { loadPageSeo } from "@/lib/seo.functions";
import { buildSeoHead } from "@/lib/seo";

const title = "РАНГ — аренда офисов и складов в Казани с 1993 года";
const description =
  "Коммерческие помещения в Казани: офисы, склады и помещения «офис + склад» в аренду и на продажу. Свободные помещения, объекты компании и услуги для арендаторов.";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [properties, objects, faq, seo] = await Promise.all([
      loadCatalogProperties({ offerType: "rent" }),
      loadCatalogObjects(),
      loadPublicFaq(),
      loadPageSeo({ data: { pageKey: "static:home" } }),
    ]);
    return { properties, objects, faq, seo };
  },
  head: ({ loaderData }) => buildSeoHead({ title, description, path: "/" }, loaderData?.seo),
  component: Index,
});

function Index() {
  const { properties, objects, faq } = Route.useLoaderData();
  const [chatOpen, setChatOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<PropertyFilters>(INITIAL_PROPERTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<PropertyFilters>(INITIAL_PROPERTY_FILTERS);

  const resetFilters = () => {
    setDraftFilters(INITIAL_PROPERTY_FILTERS);
    setAppliedFilters(INITIAL_PROPERTY_FILTERS);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero
          filters={draftFilters}
          onFiltersChange={setDraftFilters}
          onSearch={() => setAppliedFilters(draftFilters)}
          objects={objects}
        />
        <FreePremises filters={appliedFilters} onReset={resetFilters} properties={properties} />
        <ComingSoon properties={properties} />
        <PremiseTypes properties={properties} />
        <Objects objects={objects} />
        <RentSection />
        <SaleSection />
        <Services />
        <Videos />
        <Tenants />
        <About />
        <HowTo />
        <Faq items={faq} onAskAi={() => setChatOpen(true)} />
        <AiTransition onOpen={() => setChatOpen(true)} />
        <CtaForm />
        <Contacts objects={objects} />
      </main>
      <Footer />
      <AiAssistant open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
