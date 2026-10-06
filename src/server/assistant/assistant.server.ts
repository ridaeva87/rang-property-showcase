import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { currentUser } from "@/server/portal/portal.server";
import {
  APPROVED_FAQ,
  ASSISTANT_KNOWLEDGE_SOURCES,
  detectAssistantIntent,
  normalizeAssistantText,
  parseAreaCriteria,
  requestCategoryForQuestion,
} from "./knowledge";

type AssistantLink = { label: string; href: string };
type AssistantAnswer = { text: string; links: AssistantLink[]; sources: string[]; transferRecommended: boolean; premiseId?: string; objectId?: string; serviceId?: string };

const valueText = (row: { valueText: string | null; valueNumber: string | null; unit: string | null }) =>
  row.valueText || (row.valueNumber ? `${Number(row.valueNumber).toLocaleString("ru-RU")}${row.unit ? ` ${row.unit}` : ""}` : "");

async function logAssistant(input: { userId?: string | undefined; source: string; intent: string; sources: string[]; resultCount: number; handoff?: boolean | undefined; error?: boolean | undefined }) {
  await getDatabase().insert(s.analyticsEvents).values({
    id: randomUUID(), name: input.handoff ? "Передача вопроса помощника сотруднику" : "Запрос помощнику RANG",
    source: input.source, eventType: input.error ? "assistant_error" : input.handoff ? "assistant_handoff" : "assistant_query",
    userId: input.userId || null,
    context: { intent: input.intent, knowledgeSources: input.sources.join(", "), resultCount: input.resultCount, handoff: Boolean(input.handoff) },
  });
}

export async function answerAssistant(input: { question: string; premiseId?: string | undefined; objectId?: string | undefined; source: "public" | "tenant_portal" }): Promise<AssistantAnswer> {
  const user = await currentUser();
  const source = input.source === "tenant_portal" && user?.kind === "tenant" ? "Личный кабинет" : "Публичный сайт";
  const intent = detectAssistantIntent(input.question);
  const db = getDatabase();
  try {
    if (intent === "services") {
      const services = await db.select({ id: s.additionalServices.id, title: s.additionalServices.title }).from(s.additionalServices).where(eq(s.additionalServices.publicationStatus, "published")).orderBy(s.additionalServices.title);
      const answer = services.length ? `Доступные подтверждённые услуги: ${services.map((item) => item.title).join(", ")}.` : "В подтверждённом источнике сейчас нет опубликованного перечня услуг.";
      await logAssistant({ userId: user?.id, source, intent, sources: [ASSISTANT_KNOWLEDGE_SOURCES.services], resultCount: services.length });
      return { text: answer, links: services.map((item) => ({ label: item.title, href: `/services#service-${item.id}` })), sources: [ASSISTANT_KNOWLEDGE_SOURCES.services], transferRecommended: !services.length, ...(services[0] ? { serviceId: services[0].id } : {}) };
    }

    if (intent === "request_category") {
      const hint = requestCategoryForQuestion(input.question);
      const categories = await db.select({ code: s.requestCategories.code, name: s.requestCategories.name }).from(s.requestCategories);
      const category = hint && categories.find((item) => item.code === hint.code);
      const text = category ? `Для такого обращения подходит категория заявки «${category.name}». В личном кабинете её можно выбрать при подаче заявки.` : "По формулировке вопроса не удалось надёжно определить категорию. Передайте вопрос сотруднику RANG.";
      await logAssistant({ userId: user?.id, source, intent, sources: [ASSISTANT_KNOWLEDGE_SOURCES.requestCategories], resultCount: category ? 1 : 0 });
      return { text, links: user?.kind === "tenant" ? [{ label: "Подать заявку", href: "/account/#new-request" }] : [], sources: [ASSISTANT_KNOWLEDGE_SOURCES.requestCategories], transferRecommended: !category };
    }

    const rows = await db.select({
      id: s.premises.id, slug: s.premises.slug, title: s.premises.title, objectId: s.premises.objectId,
      objectName: s.propertyObjects.name, address: s.propertyObjects.address, type: s.premiseTypes.name,
      area: s.premises.areaSqm, available: s.premiseStatuses.isAvailable,
    }).from(s.premises)
      .innerJoin(s.propertyObjects, eq(s.premises.objectId, s.propertyObjects.id))
      .innerJoin(s.premiseTypes, eq(s.premises.typeId, s.premiseTypes.id))
      .leftJoin(s.premiseStatuses, eq(s.premises.statusId, s.premiseStatuses.id))
      .innerJoin(s.propertyOffers, and(eq(s.propertyOffers.premiseId, s.premises.id), eq(s.propertyOffers.type, "rent"), eq(s.propertyOffers.publicationStatus, "published")))
      .where(eq(s.premises.publicationStatus, "published"));

    const normalizedQuestion = normalizeAssistantText(input.question);
    const explicit = input.premiseId ? rows.find((row) => row.id === input.premiseId) : rows.find((row) => normalizedQuestion.includes(normalizeAssistantText(row.title)));
    if (intent === "power_380" || intent === "power_increase") {
      if (!explicit) {
        await logAssistant({ userId: user?.id, source, intent, sources: [ASSISTANT_KNOWLEDGE_SOURCES.characteristics], resultCount: 0 });
        return { text: "Укажите конкретное помещение: эта характеристика проверяется отдельно для каждой карточки. Без подтверждённой записи я не могу дать ответ.", links: [{ label: "Открыть каталог", href: "/properties" }], sources: [ASSISTANT_KNOWLEDGE_SOURCES.characteristics], transferRecommended: true };
      }
      const key = intent === "power_380" ? "power-380" : "power-increase";
      const characteristic = (await db.select({ valueText: s.premiseCharacteristics.valueText, valueNumber: s.premiseCharacteristics.valueNumber, unit: s.premiseCharacteristics.unit }).from(s.premiseCharacteristics).where(and(eq(s.premiseCharacteristics.premiseId, explicit.id), eq(s.premiseCharacteristics.key, key))).limit(1))[0];
      const confirmed = characteristic ? valueText(characteristic) : "";
      const text = confirmed ? `${explicit.title}: ${intent === "power_380" ? "380 В" : "возможность увеличения мощности"} — ${confirmed}.` : `Для помещения «${explicit.title}» подтверждённое значение этой характеристики отсутствует. Передайте вопрос сотруднику RANG.`;
      await logAssistant({ userId: user?.id, source, intent, sources: [ASSISTANT_KNOWLEDGE_SOURCES.characteristics], resultCount: confirmed ? 1 : 0 });
      return { text, links: [{ label: explicit.title, href: `/properties/${explicit.slug}` }], sources: [ASSISTANT_KNOWLEDGE_SOURCES.characteristics], transferRecommended: !confirmed, premiseId: explicit.id, objectId: explicit.objectId };
    }

    if (intent === "search") {
      const q = normalizedQuestion;
      const area = parseAreaCriteria(input.question);
      const requestedType = q.includes("склад") && q.includes("офис") ? "Офис + склад" : q.includes("склад") ? "Склад" : q.includes("офис") ? "Офис" : undefined;
      const wants380 = /\b380\b/.test(q), wants220 = /\b220\b/.test(q);
      const available = rows.filter((row) => row.available);
      const electricalIds = wants380 || wants220 ? new Set((await db.select({ premiseId: s.premiseCharacteristics.premiseId }).from(s.premiseCharacteristics).where(and(eq(s.premiseCharacteristics.key, wants380 ? "power-380" : "power-220"), inArray(s.premiseCharacteristics.valueText, ["Есть", "есть", "Да", "да"])))) .map((item) => item.premiseId)) : null;
      const typeMatches = available.filter((row) => (!requestedType || row.type === requestedType) && (!electricalIds || electricalIds.has(row.id)));
      const exact = typeMatches.filter((row) => {
        const value = Number(row.area);
        return (!area.min || value >= area.min) && (!area.max || value <= area.max);
      });
      const distance = (row: typeof rows[number]) => { const value = Number(row.area); return area.min && value < area.min ? area.min - value : area.max && value > area.max ? value - area.max : 0; };
      const selected = (exact.length ? exact : [...typeMatches].sort((a, b) => distance(a) - distance(b))).slice(0, 5);
      const criteria = [requestedType, area.min ? `от ${area.min} м²` : "", area.max ? `до ${area.max} м²` : "", wants380 ? "380 В" : "", wants220 ? "220 В" : ""].filter(Boolean).join(", ");
      const text = selected.length ? `${exact.length ? "Найдены подходящие помещения" : "Точного совпадения нет; ближайшие реальные варианты"}${criteria ? ` (${criteria})` : ""}: ${selected.map((row) => `${row.title} — ${Number(row.area).toLocaleString("ru-RU")} м²`).join("; ")}.` : "По заданным подтверждённым критериям свободных помещений не найдено. Я не буду предлагать отсутствующие варианты; вопрос можно передать сотруднику RANG.";
      await logAssistant({ userId: user?.id, source, intent, sources: [ASSISTANT_KNOWLEDGE_SOURCES.catalog, ...(wants380 || wants220 ? [ASSISTANT_KNOWLEDGE_SOURCES.characteristics] : [])], resultCount: selected.length });
      const first = selected[0];
      return { text, links: selected.map((row) => ({ label: `${row.title} · ${Number(row.area).toLocaleString("ru-RU")} м²`, href: `/properties/${row.slug}` })), sources: [ASSISTANT_KNOWLEDGE_SOURCES.catalog], transferRecommended: !exact.length, ...(first ? { premiseId: first.id, objectId: first.objectId } : {}) };
    }

    const faq = APPROVED_FAQ.find((item) => normalizeAssistantText(input.question).includes(normalizeAssistantText(item.question)));
    const text = faq?.answer || "В подтверждённой базе знаний нет достоверного ответа на этот вопрос. Я могу передать его сотруднику RANG.";
    await logAssistant({ userId: user?.id, source, intent, sources: faq ? ["Утверждённый FAQ RANG"] : [], resultCount: faq ? 1 : 0 });
    return { text, links: [], sources: faq ? ["Утверждённый FAQ RANG"] : [], transferRecommended: !faq, ...(explicit ? { premiseId: explicit.id, objectId: explicit.objectId } : {}) };
  } catch (error) {
    await logAssistant({ userId: user?.id, source, intent, sources: [], resultCount: 0, error: true }).catch(() => undefined);
    throw error;
  }
}

export async function transferAssistantQuestion(input: { question: string; context?: string | undefined; premiseId?: string | undefined; objectId?: string | undefined; serviceId?: string | undefined; name?: string | undefined; phone?: string | undefined; email?: string | undefined; source: "public" | "tenant_portal" }) {
  const user = await currentUser();
  const tenant = user?.kind === "tenant" ? user : null;
  const tenantContact = tenant ? (await getDatabase().select({ phone: s.users.phone }).from(s.users).where(eq(s.users.id, tenant.id)).limit(1))[0] : null;
  const name = tenant?.displayName || input.name?.trim();
  const phone = tenantContact?.phone || input.phone?.trim();
  const email = tenant?.email || input.email?.trim() || null;
  if (!name || (!tenant && (!phone || phone.length < 6))) throw new Error("Укажите имя и телефон");
  const db = getDatabase();
  const premise = input.premiseId ? (await db.select({ id: s.premises.id, objectId: s.premises.objectId }).from(s.premises).where(eq(s.premises.id, input.premiseId)).limit(1))[0] : undefined;
  const service = input.serviceId ? (await db.select({ id: s.additionalServices.id, title: s.additionalServices.title }).from(s.additionalServices).where(eq(s.additionalServices.id, input.serviceId)).limit(1))[0] : undefined;
  const assignee = (await db.select({ id: s.employees.id }).from(s.employees).innerJoin(s.users, eq(s.employees.userId, s.users.id)).innerJoin(s.userRoles, eq(s.userRoles.userId, s.users.id)).innerJoin(s.roles, eq(s.userRoles.roleId, s.roles.id)).where(and(eq(s.roles.code, "rental_manager"), eq(s.users.isActive, true))).orderBy(s.employees.createdAt).limit(1))[0];
  const id = randomUUID();
  const note = [`CTA: Передать вопрос сотруднику`, `Вопрос: ${input.question.trim()}`, service ? `Услуга: ${service.title}` : "", input.context ? `Контекст диалога:\n${input.context.trim().slice(-2000)}` : ""].filter(Boolean).join("\n\n");
  await db.transaction(async (tx) => {
    await tx.insert(s.propertyInterests).values({ id, userId: tenant?.id || null, premiseId: premise?.id || null, kind: "details", contactName: name, contactPhone: phone || null, contactEmail: email, note, source: input.source === "tenant_portal" ? "Помощник RANG — личный кабинет" : "Помощник RANG", status: "new", assigneeEmployeeId: assignee?.id || null });
    await tx.insert(s.auditLogs).values({ id: randomUUID(), actorUserId: tenant?.id || null, action: "assistant.handoff", entityType: "leads", entityId: id, after: { premiseId: premise?.id || null, serviceId: service?.id || null, source: input.source } });
  });
  await logAssistant({ userId: tenant?.id, source: input.source === "tenant_portal" ? "Личный кабинет" : "Публичный сайт", intent: "handoff", sources: [], resultCount: 1, handoff: true });
  return { ok: true, id };
}
