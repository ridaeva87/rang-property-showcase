import { createHash, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";

const SERVICE_REQUEST_CATEGORIES: Record<string, string> = {
  refit: "refit",
  technical: "repair",
  electrical: "electricity",
  plumbing: "plumbing",
  equipment: "repair",
  power: "electricity",
  loading: "loading",
  other: "other",
};

export function requestCategoryForIntake(input: { categoryCode?: string; serviceId?: string }) {
  return input.categoryCode || (input.serviceId ? SERVICE_REQUEST_CATEGORIES[input.serviceId] : undefined) || "other";
}

export type RequestIntakeInput = {
  idempotencyKey: string;
  idempotencyScope: string;
  categoryCode?: string;
  source: string;
  interest?: string | null;
  subject: string;
  description: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  premiseId?: string | null;
  serviceId?: string | null;
  organizationId?: string | null;
  createdByUserId?: string | null;
  actorUserId?: string | null;
  assigneeEmployeeId?: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requestIdempotencyDigest(scope: string, key: string) {
  if (!scope.trim() || !UUID_PATTERN.test(key)) throw new Error("Некорректный ключ отправки заявки");
  return createHash("sha256").update(scope.trim()).update("\0").update(key.toLowerCase()).digest("hex");
}

export async function createRequestFromIntake(input: RequestIntakeInput) {
  const db = getDatabase();
  const idempotencyKey = requestIdempotencyDigest(input.idempotencyScope, input.idempotencyKey);
  const categoryCode = requestCategoryForIntake({
    ...(input.categoryCode ? { categoryCode: input.categoryCode } : {}),
    ...(input.serviceId ? { serviceId: input.serviceId } : {}),
  });
  const [category] = await db.select({ id: s.requestCategories.id }).from(s.requestCategories).where(eq(s.requestCategories.code, categoryCode)).limit(1);
  const [status] = await db.select({ id: s.requestStatuses.id }).from(s.requestStatuses).where(eq(s.requestStatuses.code, "new")).limit(1);
  const [route] = category ? await db.select({ directionId: s.requestCategoryRoutes.directionId }).from(s.requestCategoryRoutes).where(eq(s.requestCategoryRoutes.categoryId, category.id)).limit(1) : [];
  if (!category || !status || !route) throw new Error("Справочники заявок не настроены");

  if (input.serviceId) {
    const [service] = await db.select({ id: s.additionalServices.id }).from(s.additionalServices).where(eq(s.additionalServices.id, input.serviceId)).limit(1);
    if (!service) throw new Error("Услуга не найдена");
  }

  return db.transaction(async (tx) => {
    const id = randomUUID();
    const [inserted] = await tx.insert(s.requests).values({
      id,
      idempotencyKey,
      organizationId: input.organizationId || null,
      createdByUserId: input.createdByUserId || null,
      categoryId: category.id,
      statusId: status.id,
      directionId: route.directionId,
      assigneeEmployeeId: input.assigneeEmployeeId || null,
      premiseId: input.premiseId || null,
      serviceId: input.serviceId || null,
      source: input.source,
      contactName: input.contactName?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      contactEmail: input.contactEmail?.trim().toLowerCase() || null,
      interest: input.interest?.trim() || null,
      subject: input.subject.trim(),
      description: input.description.trim(),
    }).onConflictDoNothing({ target: s.requests.idempotencyKey }).returning({
      id: s.requests.id,
      directionId: s.requests.directionId,
    });
    if (!inserted) {
      const [existing] = await tx.select({ id: s.requests.id, directionId: s.requests.directionId })
        .from(s.requests)
        .where(eq(s.requests.idempotencyKey, idempotencyKey))
        .limit(1);
      if (!existing) throw new Error("Не удалось проверить повторную отправку заявки");
      return { ...existing, created: false as const };
    }
    await tx.insert(s.requestEvents).values({
      id: randomUUID(),
      requestId: inserted.id,
      eventType: "created",
      actorUserId: input.actorUserId || input.createdByUserId || null,
    });
    return { ...inserted, created: true as const };
  });
}
