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

const title = "Ранг — аренда офисов и складов в Казани с 1993 года";
const description =
  "Коммерческие помещения в Казани: офисы, склады и помещения «офис + склад» в аренду и на продажу. Свободные помещения, объекты компании и услуги для арендаторов.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
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
        />
        <FreePremises filters={appliedFilters} onReset={resetFilters} />
        <ComingSoon />
        <PremiseTypes />
        <Objects />
        <RentSection />
        <SaleSection />
        <Services />
        <Videos />
        <Tenants />
        <About />
        <HowTo />
        <Faq onAskAi={() => setChatOpen(true)} />
        <AiTransition onOpen={() => setChatOpen(true)} />
        <CtaForm />
        <Contacts />
      </main>
      <Footer />
      <AiAssistant open={chatOpen} setOpen={setChatOpen} />
    </div>
  );
}
