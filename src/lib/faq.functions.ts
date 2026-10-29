import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { faqItemInputSchema } from "@/lib/faq";

export const loadPublicFaq = createServerFn({ method: "GET" }).handler(async () =>
  (await import("@/server/faq/faq.server")).listPublicFaq(),
);

export const loadFaqAdmin = createServerFn({ method: "GET" }).handler(async () =>
  (await import("@/server/faq/faq.server")).listFaqAdmin(),
);

export const saveFaq = createServerFn({ method: "POST" })
  .validator(faqItemInputSchema)
  .handler(async ({ data }) => (await import("@/server/faq/faq.server")).saveFaqAdmin(data));

export const moveFaq = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1), direction: z.enum(["up", "down"]) }))
  .handler(async ({ data }) => (await import("@/server/faq/faq.server")).moveFaqAdmin(data));
