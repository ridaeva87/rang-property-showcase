import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { currentUser } from "@/server/portal/portal.server";
import { publicRequestStatus } from "@/server/portal/security";
import {
  APPROVED_FAQ,
  ASSISTANT_KNOWLEDGE_SOURCES,
  detectAssistantIntent,
  isConfirmedAvailable,
  isConfirmedPositive,
  normalizeAssistantText,
  parseAreaCriteria,
  requestCategoryForQuestion,
} from "./knowledge";

type AssistantLink = { label: string; href: string };
type AssistantAnswer = { text: string; links: AssistantLink[]; sources: string[]; transferRecommended: boolean; premiseId?: string; objectId?: string; serviceId?: string };

const valueText = (row: { valueText: string | null; valueNumber: string | null; unit: string | null }) =>
  row.valueText || (row.valueNumber ? `${Number(row.valueNumber).toLocaleString("ru-RU")}${row.unit ? ` ${row.unit}` : ""}` : "");

async function tenantAssistantContext(userId: string) {
  const db = getDatabase();
  const direct = await db.select({ id: s.premises.id, title: s.premises.title, address: s.propertyObjects.address })
    .from(s.tenantPremises)
    .innerJoin(s.premises, eq(s.tenantPremises.premiseId, s.premises.id))
    .innerJoin(s.propertyObjects, eq(s.premises.objectId, s.propertyObjects.id))
    .where(eq(s.tenantPremises.userId, userId));
  const organizationIds = (await db.select({ id: s.organizationUsers.organizationId }).from(s.organizationUsers).where(eq(s.organizationUsers.userId, userId))).map((row) => row.id);
  const leased = organizationIds.length ? await db.selectDistinct({ id: s.premises.id, title: s.premises.title, address: s.propertyObjects.address })
    .from(s.leaseContracts)
    .innerJoin(s.leasePremises, eq(s.leaseContracts.id, s.leasePremises.contractId))
    .innerJoin(s.premises, eq(s.leasePremises.premiseId, s.premises.id))
    .innerJoin(s.propertyObjects, eq(s.premises.objectId, s.propertyObjects.id))
    .where(and(inArray(s.leaseContracts.organizationId, organizationIds), eq(s.leaseContracts.status, "active"))) : [];
  const premises = [...new Map([...direct, ...leased].map((row) => [row.id, row])).values()];
  const requests = await db.select({ number: s.requests.requestNumber, subject: s.requests.subject, statusCode: s.requestStatuses.code, isClosed: s.requestStatuses.isClosed, premise: s.premises.title })
    .from(s.requests)
    .innerJoin(s.requestStatuses, eq(s.requests.statusId, s.requestStatuses.id))
    .leftJoin(s.premises, eq(s.requests.premiseId, s.premises.id))
    .where(eq(s.requests.createdByUserId, userId))
    .orderBy(sql`${s.requests.createdAt} desc`)
    .limit(20);
  return { premises, requests };
}

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
    if (intent === "tenant_premises" || intent === "tenant_requests") {
      if (input.source !== "tenant_portal" || user?.kind !== "tenant") {
        await logAssistant({ userId: user?.id, source, intent, sources: [], resultCount: 0 });
        return { text: "Персональные данные доступны только арендатору после входа в личный кабинет.", links: [{ label: "Войти в личный кабинет", href: "/account/login" }], sources: [], transferRecommended: false };
      }
      const context = await tenantAssistantContext(user.id);
      if (intent === "tenant_premises") {
        const text = context.premises.length
          ? `Ваши помещения: ${context.premises.map((item) => `${item.title} — ${item.address}`).join("; ")}.`
          : "К вашему аккаунту сейчас не привязаны помещения.";
        await logAssistant({ userId: user.id, source, intent, sources: ["Связи арендатора с помещениями PostgreSQL"], resultCount: context.premises.length });
        return { text, links: [{ label: "Мои помещения", href: "/account/#premises" }], sources: ["Связи арендатора с помещениями PostgreSQL"], transferRecommended: false };
      }
      const text = context.requests.length
        ? `Ваши заявки: ${context.requests.map((item) => `№${item.number} «${item.subject}» — ${publicRequestStatus(item.statusCode, item.isClosed)}${item.premise ? `, ${item.premise}` : ""}`).join("; ")}.`
        : "У вас пока нет заявок.";
      await logAssistant({ userId: user.id, source, intent, sources: ["Заявки текущего арендатора PostgreSQL"], resultCount: context.requests.length });
      return { text, links: [{ label: "Мои заявки", href: "/account/#requests" }], sources: ["Заявки текущего арендатора PostgreSQL"], transferRecommended: false };
    }

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
      area: s.premises.areaSqm, statusCode: s.premiseStatuses.code, statusName: s.premiseStatuses.name, isAvailable: s.premiseStatuses.isAvailable,
    }).from(s.premises)
      .innerJoin(s.propertyObjects, eq(s.premises.objectId, s.propertyObjects.id))
      .innerJoin(s.premiseTypes, eq(s.premises.typeId, s.premiseTypes.id))
      .leftJoin(s.premiseStatuses, eq(s.premises.statusId, s.premiseStatuses.id))
      .innerJoin(s.propertyOffers, and(eq(s.propertyOffers.premiseId, s.premises.id), eq(s.propertyOffers.type, "rent"), eq(s.propertyOffers.publicationStatus, "published")))
      .where(eq(s.premises.publicationStatus, "published"));

    const normalizedQuestion = normalizeAssistantText(input.question);
    const explicit = input.premiseId ? rows.find((row) => row.id === input.premiseId) : rows.find((row) => normalizedQuestion.includes(normalizeAssistantText(row.title)));
    if (intent === "power_380" || intent === "power_increase") {
      if (intent === "power_380" && !explicit) {
        const characteristics = await db.select({ premiseId: s.premiseCharacteristics.premiseId, valueText: s.premiseCharacteristics.valueText })
          .from(s.premiseCharacteristics).where(eq(s.premiseCharacteristics.key, "power-380"));
        const confirmedIds = new Set(characteristics.filter((item) => isConfirmedPositive(item.valueText)).map((item) => item.premiseId));
        const selected = rows.filter((row) => isConfirmedAvailable(row) && confirmedIds.has(row.id)).slice(0, 5);
        const text = selected.length
          ? `Свободные помещения с подтверждёнными 380 В: ${selected.map((row) => `${row.title} — ${Number(row.area).toLocaleString("ru-RU")} м²`).join("; ")}.`
          : "Среди опубликованных свободных помещений сейчас нет карточек с подтверждённым признаком 380 В.";
        await logAssistant({ userId: user?.id, source, intent, sources: [ASSISTANT_KNOWLEDGE_SOURCES.catalog, ASSISTANT_KNOWLEDGE_SOURCES.characteristics], resultCount: selected.length });
        const first = selected[0];
        return { text, links: selected.map((row) => ({ label: `${row.title} · ${Number(row.area).toLocaleString("ru-RU")} м²`, href: `/properties/${row.slug}` })), sources: [ASSISTANT_KNOWLEDGE_SOURCES.catalog, ASSISTANT_KNOWLEDGE_SOURCES.characteristics], transferRecommended: !selected.length, ...(first ? { premiseId: first.id, objectId: first.objectId } : {}) };
      }
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
      const available = rows.filter(isConfirmedAvailable);
      const electricalIds = wants380 || wants220 ? new Set((await db.select({ premiseId: s.premiseCharacteristics.premiseId, valueText: s.premiseCharacteristics.valueText }).from(s.premiseCharacteristics).where(eq(s.premiseCharacteristics.key, wants380 ? "power-380" : "power-220"))).filter((item) => isConfirmedPositive(item.valueText)).map((item) => item.premiseId)) : null;
      const matchesType = (actual: string) => !requestedType || (requestedType === "Склад" ? normalizeAssistantText(actual).includes("склад") : requestedType === "Офис" ? normalizeAssistantText(actual).includes("офис") : actual === requestedType);
      const typeMatches = available.filter((row) => matchesType(row.type) && (!electricalIds || electricalIds.has(row.id)));
      const exact = typeMatches.filter((row) => {
        const value = Number(row.area);
        return (!area.min || value >= area.min) && (!area.max || value <= area.max);
      });
      const distance = (row: typeof rows[number]) => { const value = Number(row.area); return area.min && value < area.min ? area.min - value : area.max && value > area.max ? value - area.max : 0; };
      const fallback = typeMatches.length ? typeMatches : available.filter((row) => !electricalIds || electricalIds.has(row.id));
      const selected = (exact.length ? exact : [...fallback].sort((a, b) => distance(a) - distance(b))).slice(0, 5);
      const criteria = [requestedType, area.min ? `от ${area.min} м²` : "", area.max ? `до ${area.max} м²` : "", wants380 ? "380 В" : "", wants220 ? "220 В" : ""].filter(Boolean).join(", ");
      const text = selected.length ? `${exact.length ? "Найдены подходящие помещения" : "Точного совпадения нет; ближайшие реальные варианты с отличием по типу или площади"}${criteria ? ` (${criteria})` : ""}: ${selected.map((row) => `${row.title} — ${row.type}, ${Number(row.area).toLocaleString("ru-RU")} м²`).join("; ")}.` : "По заданным подтверждённым критериям свободных помещений не найдено. Я не буду предлагать отсутствующие варианты; вопрос можно передать сотруднику RANG.";
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
