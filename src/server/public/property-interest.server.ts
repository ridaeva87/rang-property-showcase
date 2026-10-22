import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { currentUser } from "@/server/portal/portal.server";
import { createRequestFromIntake } from "@/server/requests/intake.server";
import { requirePersonalDataConsent } from "@/lib/consents";

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
  idempotencyKey: string;
  premiseId: string;
  objectId?: string | undefined;
  type: PublicInterestType;
  name: string;
  phone: string;
  email?: string | undefined;
  message?: string | undefined;
  personalDataConsent: boolean;
}) {
  const db = getDatabase();
  const premise = (await db.select({ id: s.premises.id, objectId: s.premises.objectId, title: s.premises.title })
    .from(s.premises)
    .where(and(eq(s.premises.id, input.premiseId), eq(s.premises.publicationStatus, "published")))
    .limit(1))[0];
  if (!premise) throw new Error("Помещение недоступно");

  const descriptor = PUBLIC_INTEREST_LABELS[input.type];
  const personalDataConsent = requirePersonalDataConsent(input.personalDataConsent, `public_form:${descriptor.source}`);
  const user = await currentUser();
  const organization = user?.kind === "tenant" ? (await db.select({ id: s.organizationUsers.organizationId }).from(s.organizationUsers).where(eq(s.organizationUsers.userId, user.id)).limit(1))[0] : null;
  const assignee = (await db.select({ id: s.employees.id })
    .from(s.employees)
    .innerJoin(s.users, eq(s.employees.userId, s.users.id))
    .innerJoin(s.userRoles, eq(s.userRoles.userId, s.users.id))
    .innerJoin(s.roles, eq(s.userRoles.roleId, s.roles.id))
    .where(and(eq(s.roles.code, "rental_manager"), eq(s.users.isActive, true)))
    .orderBy(s.employees.createdAt)
    .limit(1))[0];
  const request = await createRequestFromIntake({
    idempotencyKey: input.idempotencyKey,
    idempotencyScope: user
      ? `user:${user.id}:property:${premise.id}:${input.type}`
      : `public:${input.phone.trim()}:${input.email?.trim().toLowerCase() || "-"}:property:${premise.id}:${input.type}`,
    source: descriptor.source,
    interest: descriptor.cta,
    subject: `${descriptor.cta}: ${premise.title}`,
    description: input.message?.trim() || descriptor.cta,
    contactName: input.name,
    contactPhone: input.phone,
    contactEmail: input.email || null,
    premiseId: premise.id,
    organizationId: organization?.id || null,
    createdByUserId: user?.kind === "tenant" ? user.id : null,
    actorUserId: user?.id || null,
    assigneeEmployeeId: assignee?.id || null,
    personalDataConsent,
  });
  if (request.created) await db.transaction(async (tx) => {
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
      entityType: "requests",
      entityId: request.id,
      after: { source: descriptor.source, cta: descriptor.cta, premiseId: premise.id },
    });
  });
  return { ok: true, id: request.id, assigned: Boolean(assignee) };
}

const PUBLIC_REQUEST_SOURCES = {
  rent: "Публичный сайт — аренда",
  sale: "Публичный сайт — продажа",
  services: "Публичный сайт — услуги",
} as const;

export async function submitPublicRequest(input: {
  idempotencyKey: string;
  source: keyof typeof PUBLIC_REQUEST_SOURCES;
  subject: string;
  name: string;
  phone: string;
  email?: string | undefined;
  message?: string | undefined;
  serviceId?: string | undefined;
  personalDataConsent: boolean;
}) {
  const db = getDatabase();
  const service = input.serviceId ? (await db.select({ id: s.additionalServices.id, title: s.additionalServices.title }).from(s.additionalServices).where(and(eq(s.additionalServices.id, input.serviceId), eq(s.additionalServices.publicationStatus, "published"))).limit(1))[0] : null;
  if (input.serviceId && !service) throw new Error("Услуга недоступна");
  const assignee = (await db.select({ id: s.employees.id }).from(s.employees)
    .innerJoin(s.users, eq(s.employees.userId, s.users.id))
    .innerJoin(s.userRoles, eq(s.userRoles.userId, s.users.id))
    .innerJoin(s.roles, eq(s.userRoles.roleId, s.roles.id))
    .where(and(eq(s.roles.code, "rental_manager"), eq(s.users.isActive, true)))
    .orderBy(s.employees.createdAt).limit(1))[0];
  const source = PUBLIC_REQUEST_SOURCES[input.source];
  const personalDataConsent = requirePersonalDataConsent(input.personalDataConsent, `public_form:${source}`);
  const interest = service?.title || input.subject;
  const request = await createRequestFromIntake({
    idempotencyKey: input.idempotencyKey,
    idempotencyScope: `public:${input.phone.trim()}:${input.email?.trim().toLowerCase() || "-"}:${input.source}:${service?.id || "general"}`,
    source,
    interest,
    subject: service ? `Заявка на услугу: ${service.title}` : input.subject,
    description: input.message?.trim() || input.subject,
    contactName: input.name,
    contactPhone: input.phone,
    contactEmail: input.email || null,
    serviceId: service?.id || null,
    assigneeEmployeeId: assignee?.id || null,
    personalDataConsent,
  });
  if (request.created) await db.insert(s.analyticsEvents).values({
    id: randomUUID(),
    name: "Успешное публичное обращение",
    source,
    eventType: "premise_lead",
    serviceId: service?.id || null,
    context: { cta: input.subject, requestId: request.id },
  });
  return { ok: true, id: request.id };
}
