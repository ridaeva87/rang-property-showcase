import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { seoInputSchema } from "@/lib/seo";

export const loadPageSeo = createServerFn({ method: "GET" })
  .validator(z.object({ pageKey: z.string().min(1) }))
  .handler(async ({ data }) => (await import("@/server/seo/seo.server")).getPageSeo(data.pageKey));

export const loadSeoAdmin = createServerFn({ method: "GET" })
  .handler(async () => (await import("@/server/seo/seo.server")).listSeoAdmin());

export const savePageSeo = createServerFn({ method: "POST" })
  .validator(seoInputSchema)
  .handler(async ({ data }) => (await import("@/server/seo/seo.server")).saveSeoAdmin(data));
