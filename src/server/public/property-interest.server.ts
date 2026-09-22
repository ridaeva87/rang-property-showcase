import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { currentUser } from "@/server/portal/portal.server";

export type PublicInterestType = "viewing" | "application" | "release-notification" | "details" | "question";

export const PUBLIC_INTEREST_LABELS: Record<PublicInterestType, { kind: "viewing" | "application" | "release_waitlist" | "details"; cta: string; source: string }> = {
  viewing: { kind: "viewing", cta: "Записаться на просмотр", source: "Карточка помещения" },
  application: { kind: "application", cta: "Оставить заявку", source: "Карточка помещения" },
  "release-notification": { kind: "release_waitlist", cta: "Оставить заявку", source: "Карточка помещения" },
  details: { kind: "details", cta: "Узнать подробности", source: "Карточка помещения" },
  question: { kind: "details", cta: "Задать вопрос", source: "Помощник RANG" },
};

export function interestNote(message: string | undefined, cta: string) {
  return [`CTA: ${cta}`, message?.trim()].filter(Boolean).join("\n\n");
}

export async function submitPropertyInterest(input: {
  premiseId: string;
  objectId?: string | undefined;
  type: PublicInterestType;
  name: string;
  phone: string;
  email?: string | undefined;
  message?: string | undefined;
}) {
  const db = getDatabase();
  const premise = (await db.select({ id: s.premises.id, objectId: s.premises.objectId })
    .from(s.premises)
    .where(and(eq(s.premises.id, input.premiseId), eq(s.premises.publicationStatus, "published")))
    .limit(1))[0];
  if (!premise) throw new Error("Помещение недоступно");

  const descriptor = PUBLIC_INTEREST_LABELS[input.type];
  const user = await currentUser();
  const assignee = (await db.select({ id: s.employees.id })
    .from(s.employees)
    .innerJoin(s.users, eq(s.employees.userId, s.users.id))
    .innerJoin(s.userRoles, eq(s.userRoles.userId, s.users.id))
    .innerJoin(s.roles, eq(s.userRoles.roleId, s.roles.id))
    .where(and(eq(s.roles.code, "rental_manager"), eq(s.users.isActive, true)))
    .orderBy(s.employees.createdAt)
    .limit(1))[0];
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(s.propertyInterests).values({
      id,
      userId: user?.id || null,
      premiseId: premise.id,
      kind: descriptor.kind,
      contactName: input.name.trim(),
      contactPhone: input.phone.trim(),
      contactEmail: input.email?.trim() || null,
      note: interestNote(input.message, descriptor.cta),
      source: descriptor.source,
      status: "new",
      assigneeEmployeeId: assignee?.id || null,
    });
    await tx.insert(s.analyticsEvents).values({
      id: randomUUID(),
      name: "Успешное обращение по помещению",
      source: descriptor.source,
      eventType: "premise_lead",
      userId: user?.id || null,
      premiseId: premise.id,
      objectId: input.objectId || premise.objectId,
      context: { cta: descriptor.cta, inquiryType: input.type },
    });
    await tx.insert(s.auditLogs).values({
      id: randomUUID(),
      actorUserId: user?.id || null,
      action: "lead.created.public",
      entityType: "leads",
      entityId: id,
      after: { source: descriptor.source, cta: descriptor.cta, premiseId: premise.id },
    });
  });
  return { ok: true, id, assigned: Boolean(assignee) };
}
