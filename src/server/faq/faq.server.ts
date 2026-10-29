import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { requirePermission } from "@/server/portal/portal.server";
import { FAQ_MANAGE_PERMISSION, mergePublishedFaq, moveFaqOrder } from "@/lib/faq";

export async function listPublicFaq() {
  const db = getDatabase();
  const stored = await db
    .select({
      id: schema.faqItems.id,
      question: schema.faqItems.question,
      answer: schema.faqItems.answer,
      category: schema.faqItems.category,
      displayOrder: schema.faqItems.displayOrder,
    })
    .from(schema.faqItems)
    .where(eq(schema.faqItems.publicationStatus, "published"))
    .orderBy(schema.faqItems.displayOrder, schema.faqItems.createdAt);
  return mergePublishedFaq(stored);
}

export async function listFaqAdmin() {
  await requirePermission(FAQ_MANAGE_PERMISSION);
  const db = getDatabase();
  return db
    .select()
    .from(schema.faqItems)
    .orderBy(schema.faqItems.displayOrder, schema.faqItems.createdAt);
}

export async function saveFaqAdmin(input: {
  id?: string | undefined;
  question: string;
  answer: string;
  category: string;
  publicationStatus: "draft" | "published" | "archived";
}) {
  const actor = await requirePermission(FAQ_MANAGE_PERMISSION);
  const db = getDatabase();
  const now = new Date();
  const values = {
    question: input.question.trim(),
    answer: input.answer.trim(),
    category: input.category.trim(),
    publicationStatus: input.publicationStatus,
    updatedAt: now,
  };
  let id = input.id;
  if (id) {
    const existing = await db.select({ id: schema.faqItems.id }).from(schema.faqItems).where(eq(schema.faqItems.id, id)).limit(1);
    if (!existing[0]) throw new Error("Вопрос FAQ не найден");
    await db.update(schema.faqItems).set(values).where(eq(schema.faqItems.id, id));
  } else {
    id = randomUUID();
    const result = await db.select({ value: sql<number>`coalesce(max(${schema.faqItems.displayOrder}), -1)` }).from(schema.faqItems);
    await db.insert(schema.faqItems).values({ id, ...values, displayOrder: Number(result[0]?.value ?? -1) + 1 });
  }
  await db.insert(schema.auditLogs).values({
    id: randomUUID(),
    actorUserId: actor.id,
    action: `faq.${input.id ? "updated" : "created"}`,
    entityType: "faq",
    entityId: id,
    after: { question: values.question, category: values.category, publicationStatus: values.publicationStatus },
  });
  return { id };
}

export async function moveFaqAdmin(input: { id: string; direction: "up" | "down" }) {
  const actor = await requirePermission(FAQ_MANAGE_PERMISSION);
  const db = getDatabase();
  const items = await db.select({ id: schema.faqItems.id }).from(schema.faqItems).orderBy(schema.faqItems.displayOrder, schema.faqItems.createdAt);
  const orderedIds = moveFaqOrder(items.map((item) => item.id), input.id, input.direction);
  if (orderedIds.every((id, index) => id === items[index]?.id)) return { ok: true };
  await db.transaction(async (tx) => {
    await Promise.all(orderedIds.map((id, displayOrder) => tx.update(schema.faqItems).set({ displayOrder, updatedAt: new Date() }).where(eq(schema.faqItems.id, id))));
    await tx.insert(schema.auditLogs).values({
      id: randomUUID(), actorUserId: actor.id, action: "faq.reordered", entityType: "faq", entityId: input.id,
      after: { direction: input.direction },
    });
  });
  return { ok: true };
}
