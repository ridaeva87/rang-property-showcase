import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { requirePermission } from "@/server/portal/portal.server";
import { normalizeSeoInput, SEO_MANAGE_PERMISSION, seoInputSchema, slugFromSeoPath, STATIC_SEO_PAGES, type SeoOverrides } from "@/lib/seo";
import type { z } from "zod";

export async function getPageSeo(pageKey: string): Promise<SeoOverrides | null> {
  const result = await getDatabase().select({
    title: schema.seoPageSettings.title,
    description: schema.seoPageSettings.description,
    ogTitle: schema.seoPageSettings.ogTitle,
    ogDescription: schema.seoPageSettings.ogDescription,
    ogImageUrl: schema.seoPageSettings.ogImageUrl,
  }).from(schema.seoPageSettings).where(eq(schema.seoPageSettings.pageKey, pageKey)).limit(1);
  return result[0] ?? null;
}

export async function listSeoAdmin() {
  await requirePermission(SEO_MANAGE_PERMISSION);
  const db = getDatabase();
  const [settings, objects, premises] = await Promise.all([
    db.select().from(schema.seoPageSettings),
    db.select({ id: schema.propertyObjects.id, name: schema.propertyObjects.name, slug: schema.propertyObjects.slug, description: schema.propertyObjects.description, publicationStatus: schema.propertyObjects.publicationStatus }).from(schema.propertyObjects).orderBy(schema.propertyObjects.name),
    db.select({ id: schema.premises.id, name: schema.premises.title, slug: schema.premises.slug, description: schema.premises.description, publicationStatus: schema.premises.publicationStatus }).from(schema.premises).orderBy(schema.premises.title),
  ]);
  const byKey = new Map(settings.map((item) => [item.pageKey, item]));
  const entry = (value: { key: string; kind: "static" | "object" | "premise"; name: string; path: string; title: string; description: string; publicationStatus: string }) => ({ ...value, seo: byKey.get(value.key) ?? null });
  return [
    ...STATIC_SEO_PAGES.map((page) => entry({ key: page.key, kind: "static", name: page.name, path: page.path, title: page.title, description: page.description, publicationStatus: "published" })),
    ...objects.map((object) => entry({ key: `object:${object.id}`, kind: "object", name: `Объект: ${object.name}`, path: `/objects/${object.slug}`, title: `${object.name} — РАНГ`, description: object.description || object.name, publicationStatus: object.publicationStatus })),
    ...premises.map((premise) => entry({ key: `premise:${premise.id}`, kind: "premise", name: `Помещение: ${premise.name}`, path: `/properties/${premise.slug}`, title: `${premise.name} — РАНГ`, description: premise.description || premise.name, publicationStatus: premise.publicationStatus })),
  ];
}

export async function saveSeoAdmin(input: z.infer<typeof seoInputSchema>) {
  const actor = await requirePermission(SEO_MANAGE_PERMISSION);
  const db = getDatabase();
  const now = new Date();
  const staticPage = STATIC_SEO_PAGES.find((page) => page.key === input.pageKey);
  if (staticPage && input.path !== staticPage.path) throw new Error("URL системной страницы нельзя изменить без изменения маршрута");
  const [kind, entityId] = input.pageKey.split(":");
  await db.transaction(async (tx) => {
    if (kind === "object" && entityId) {
      const slug = slugFromSeoPath("object", input.path);
      const found = await tx.select({ id: schema.propertyObjects.id }).from(schema.propertyObjects).where(eq(schema.propertyObjects.id, entityId)).limit(1);
      if (!found[0]) throw new Error("Объект не найден");
      await tx.update(schema.propertyObjects).set({ slug, updatedAt: now }).where(eq(schema.propertyObjects.id, entityId));
    } else if (kind === "premise" && entityId) {
      const slug = slugFromSeoPath("premise", input.path);
      const found = await tx.select({ id: schema.premises.id }).from(schema.premises).where(eq(schema.premises.id, entityId)).limit(1);
      if (!found[0]) throw new Error("Помещение не найдено");
      await tx.update(schema.premises).set({ slug, updatedAt: now }).where(eq(schema.premises.id, entityId));
    } else if (!staticPage) {
      throw new Error("Страница не найдена");
    }
    const values = { ...normalizeSeoInput(input), updatedAt: now };
    await tx.insert(schema.seoPageSettings).values({ id: randomUUID(), pageKey: input.pageKey, ...values }).onConflictDoUpdate({ target: schema.seoPageSettings.pageKey, set: values });
    await tx.insert(schema.auditLogs).values({ id: randomUUID(), actorUserId: actor.id, action: "seo.updated", entityType: "seo_page", entityId: input.pageKey, after: { path: input.path, ...values } });
  });
  return { ok: true };
}

export async function getSitemapXml() {
  const db = getDatabase();
  const [objects, premises] = await Promise.all([
    db.select({ slug: schema.propertyObjects.slug }).from(schema.propertyObjects).where(eq(schema.propertyObjects.publicationStatus, "published")),
    db.select({ slug: schema.premises.slug }).from(schema.premises).where(eq(schema.premises.publicationStatus, "published")),
  ]);
  const { buildSitemapXml } = await import("@/lib/seo");
  return buildSitemapXml([
    ...STATIC_SEO_PAGES.map((page) => page.path),
    ...objects.map((object) => `/objects/${object.slug}`),
    ...premises.map((premise) => `/properties/${premise.slug}`),
  ]);
}
