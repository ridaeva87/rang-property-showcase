import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as s from "@/server/db/schema";
import { requirePermission } from "@/server/portal/portal.server";

export type Audience = { scope: "all" | "tenant" | "group" | "object" | "type"; id?: string | undefined };
export type Channel = "in_app" | "email" | "telegram" | "sms";

const permissionFor = (kind: string) => kind === "mailing" ? "mailings.manage" : kind === "announcement" ? "announcements.manage" : "notifications.manage";

export async function resolveRecipients(audience: Audience) {
  const db = getDatabase();
  const users = await db.select({ id: s.users.id, name: s.users.displayName, email: s.users.email })
    .from(s.users).where(and(eq(s.users.kind, "tenant"), eq(s.users.isActive, true)));
  if (audience.scope === "all") return users;
  if (!audience.id) return [];
  if (audience.scope === "tenant") return users.filter((user) => user.id === audience.id);
  if (audience.scope === "group") {
    const ids = new Set((await db.select({ id: s.tenantGroupMembers.userId }).from(s.tenantGroupMembers)
      .where(eq(s.tenantGroupMembers.groupId, audience.id))).map((row) => row.id));
    return users.filter((user) => ids.has(user.id));
  }
  const links = await db.select({ userId: s.tenantPremises.userId, objectId: s.premises.objectId, typeId: s.premises.typeId })
    .from(s.tenantPremises).innerJoin(s.premises, eq(s.tenantPremises.premiseId, s.premises.id));
  const ids = new Set(links.filter((link) => audience.scope === "object" ? link.objectId === audience.id : link.typeId === audience.id).map((link) => link.userId));
  return users.filter((user) => ids.has(user.id));
}

export async function communicationsAdmin(kind: "notification" | "announcement" | "mailing") {
  await requirePermission(permissionFor(kind));
  const db = getDatabase();
  const [items, tenants, groups, objects, types] = await Promise.all([
    db.select().from(s.announcements).where(eq(s.announcements.kind, kind)).orderBy(sql`${s.announcements.createdAt} desc`),
    db.select({ id: s.users.id, name: s.users.displayName, email: s.users.email }).from(s.users).where(and(eq(s.users.kind, "tenant"), eq(s.users.isActive, true))).orderBy(s.users.displayName),
    db.select({ id: s.tenantGroups.id, name: s.tenantGroups.name }).from(s.tenantGroups).orderBy(s.tenantGroups.name),
    db.select({ id: s.propertyObjects.id, name: s.propertyObjects.address }).from(s.propertyObjects).orderBy(s.propertyObjects.address),
    db.select({ id: s.premiseTypes.id, name: s.premiseTypes.name }).from(s.premiseTypes).orderBy(s.premiseTypes.name),
  ]);
  return { items, tenants, groups, objects, types };
}

export async function previewAudience(kind: string, audience: Audience) {
  await requirePermission(permissionFor(kind));
  const recipients = await resolveRecipients(audience);
  return { count: new Set(recipients.map((recipient) => recipient.id)).size };
}

export async function saveCommunication(input: {
  id?: string | undefined; kind: "notification" | "announcement" | "mailing"; title: string; subject?: string | undefined; body: string;
  category?: string | undefined; audience: Audience; channels: Channel[]; status: string; startsAt?: string | undefined; endsAt?: string | undefined; send: boolean;
}) {
  const actor = await requirePermission(permissionFor(input.kind));
  const db = getDatabase(), id = input.id || randomUUID(), now = new Date();
  const existing = input.id ? (await db.select().from(s.announcements).where(eq(s.announcements.id, input.id)).limit(1))[0] : null;
  const existingAudience = existing?.audience as Record<string, string | null> | undefined;
  const waitlistRecipientId = existingAudience?.["waitlistId"] ? existingAudience["id"] : null;
  if (waitlistRecipientId && (input.audience.scope !== "tenant" || input.audience.id !== waitlistRecipientId))
    throw new Error("Получателя персонального уведомления из листа ожидания изменять нельзя");
  const effectiveAudience = waitlistRecipientId ? { scope: "tenant" as const, id: waitlistRecipientId } : input.audience;
  const status = input.send ? "sent" : input.status;
  const storedAudience = { scope: effectiveAudience.scope, id: effectiveAudience.id || null, ...(existingAudience?.["waitlistId"] ? { waitlistId: existingAudience["waitlistId"] } : {}) };
  const recipients = [...new Map((await resolveRecipients(effectiveAudience)).map((recipient) => [recipient.id, recipient])).values()];
  if (input.send && recipients.length === 0) throw new Error("Для выбранного сегмента нет доступных получателей");
  if (input.send && input.channels.includes("email")) {
    const withoutEmail = recipients.filter((recipient) => !recipient.email);
    if (withoutEmail.length) throw new Error("У получателя не указан email. Отправка по email невозможна");
  }
  const values = { title: input.title, subject: input.subject || input.title, body: input.body, category: input.category || null,
    audience: storedAudience, channels: input.channels, status, startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null, publishedAt: input.kind === "announcement" && input.send ? now : null,
    sentAt: input.send ? now : null, updatedAt: now };
  if (input.id) await db.update(s.announcements).set(values).where(and(eq(s.announcements.id, id), eq(s.announcements.kind, input.kind)));
  else await db.insert(s.announcements).values({ id, kind: input.kind, ...values });
  if (!input.send) return { id, recipients: 0 };

  const consentRows = await db.select().from(s.userChannelConsents);
  const consent = new Set(consentRows.filter((row) => row.status === "granted").map((row) => `${row.userId}:${row.channel}`));
  const { sendProjectEmail } = await import("@/server/portal/email.server");
  for (const recipient of recipients) {
    await db.insert(s.announcementRecipients).values({ id: randomUUID(), announcementId: id, kind: "user", recipientId: recipient.id });
    for (const channel of input.channels) {
      let deliveryStatus: "sent" | "error" | "skipped" = "sent", reason: string | null = null;
      if (channel === "in_app") {
        await db.insert(s.notifications).values({ id: randomUUID(), userId: recipient.id, announcementId: id, channel, title: input.subject || input.title, body: input.body, deliveredAt: now });
      } else if (channel === "telegram" || channel === "sms") {
        deliveryStatus = "skipped"; reason = "Канал не подключён";
      } else if (!consent.has(`${recipient.id}:email`)) {
        deliveryStatus = "skipped"; reason = "Нет согласия на email";
      } else if (!recipient.email || !(await sendProjectEmail({ to: recipient.email, subject: input.subject || input.title, text: input.body }))) {
        deliveryStatus = "error"; reason = "Email не принят провайдером";
      }
      await db.insert(s.deliveryLogs).values({ id: randomUUID(), announcementId: id, recipientUserId: recipient.id, channel, status: deliveryStatus, reason, initiatedByUserId: actor.id });
    }
  }
  return { id, recipients: recipients.length };
}

export async function deliveryLogAdmin(filters: { channel?: string | undefined; status?: string | undefined; kind?: string | undefined; recipient?: string | undefined; date?: string | undefined }) {
  await requirePermission("delivery_logs.view");
  const db = getDatabase();
  const rows = await db.select({ id: s.deliveryLogs.id, createdAt: s.deliveryLogs.createdAt, channel: s.deliveryLogs.channel,
    status: s.deliveryLogs.status, reason: s.deliveryLogs.reason, recipientId: s.deliveryLogs.recipientUserId,
    recipient: s.users.displayName, message: s.announcements.title, kind: s.announcements.kind })
    .from(s.deliveryLogs).innerJoin(s.users, eq(s.deliveryLogs.recipientUserId, s.users.id))
    .leftJoin(s.announcements, eq(s.deliveryLogs.announcementId, s.announcements.id)).orderBy(sql`${s.deliveryLogs.createdAt} desc`);
  const planned = await db.select({ id:s.announcements.id,createdAt:s.announcements.createdAt,message:s.announcements.title,kind:s.announcements.kind,status:s.announcements.status,channels:s.announcements.channels,audience:s.announcements.audience }).from(s.announcements).where(sql`${s.announcements.status} in ('draft','scheduled')`);
  const combined = [...rows, ...planned.flatMap((item) => item.channels.map((channel) => ({ id:`${item.id}:${channel}`,createdAt:item.createdAt,channel,status:"prepared",reason:null,recipientId:null,recipient:`Сегмент: ${item.audience["scope"]}`,message:item.message,kind:item.kind })))]
  return combined.filter((row) => (!filters.channel || row.channel === filters.channel) && (!filters.status || row.status === filters.status)
    && (!filters.kind || row.kind === filters.kind) && (!filters.recipient || row.recipientId === filters.recipient)
    && (!filters.date || row.createdAt.toISOString().slice(0, 10) === filters.date));
}

/** Transparent matching: exact premise wins; otherwise every supplied type/object/area/price criterion must match. */
export function waitlistMatch(entry: { premiseId?: string | null; premiseTypeId?: string | null; objectId?: string | null; areaMin?: string | null; areaMax?: string | null; priceMin?: string | null; priceMax?: string | null }, premise: { id: string; typeId: string; objectId: string; area: string | null; price: string | null }) {
  if (entry.premiseId) return entry.premiseId === premise.id ? ["Конкретное помещение"] : [];
  const reasons: string[] = [], area = Number(premise.area), price = Number(premise.price);
  if (entry.premiseTypeId && entry.premiseTypeId !== premise.typeId) return [];
  if (entry.premiseTypeId) reasons.push("Тип помещения");
  if (entry.objectId && entry.objectId !== premise.objectId) return [];
  if (entry.objectId) reasons.push("Объект/адрес");
  if (entry.areaMin && (!Number.isFinite(area) || area < Number(entry.areaMin))) return [];
  if (entry.areaMax && (!Number.isFinite(area) || area > Number(entry.areaMax))) return [];
  if (entry.areaMin || entry.areaMax) reasons.push("Площадь");
  if (entry.priceMin && (!Number.isFinite(price) || price < Number(entry.priceMin))) return [];
  if (entry.priceMax && (!Number.isFinite(price) || price > Number(entry.priceMax))) return [];
  if (entry.priceMin || entry.priceMax) reasons.push("Цена");
  return reasons;
}

export async function waitlistAdmin() {
  await requirePermission("waitlist.manage"); const db = getDatabase();
  const [items, tenants, premises, objects, types, available] = await Promise.all([
    db.select().from(s.waitlistEntries).orderBy(sql`${s.waitlistEntries.createdAt} desc`),
    db.select({ id:s.users.id,name:s.users.displayName }).from(s.users).where(eq(s.users.kind,"tenant")),
    db.select({ id:s.premises.id,name:s.premises.title,address:s.propertyObjects.address,objectId:s.propertyObjects.id }).from(s.premises).innerJoin(s.propertyObjects,eq(s.premises.objectId,s.propertyObjects.id)),
    db.select({ id:s.propertyObjects.id,name:s.propertyObjects.address }).from(s.propertyObjects), db.select({ id:s.premiseTypes.id,name:s.premiseTypes.name }).from(s.premiseTypes),
    db.select({id:s.premises.id,typeId:s.premises.typeId,objectId:s.premises.objectId,area:s.premises.areaSqm,price:s.propertyOffers.rentPricePerSqm,title:s.premises.title}).from(s.premises).leftJoin(s.propertyOffers,eq(s.propertyOffers.premiseId,s.premises.id)).where(eq(s.premises.publicationStatus,"published")),
  ]);
  return { items: items.map((item) => ({ ...item, matches: item.status === "active" ? available.map((p) => ({ id:p.id,title:p.title,reasons:waitlistMatch(item,p) })).filter((x) => x.reasons.length) : [] })), tenants, premises, objects, types };
}

export async function saveWaitlist(input: { id?:string|undefined;userId?:string|undefined;email?:string|undefined;phone?:string|undefined;name?:string|undefined;source:"favorite"|"interest"|"request"|"waitlist"|"similar";premiseId?:string|undefined;typeId?:string|undefined;objectId?:string|undefined;areaMin?:string|undefined;areaMax?:string|undefined;priceMin?:string|undefined;priceMax?:string|undefined;status:string;note?:string|undefined }) {
  await requirePermission("waitlist.manage"); const db=getDatabase(),id=input.id||randomUUID();
  if(!input.userId&&!input.email&&!input.phone) throw new Error("Укажите арендатора или контакт");
  const values={userId:input.userId||null,contactEmail:input.email||null,contactPhone:input.phone||null,contactName:input.name||null,source:input.source,premiseId:input.premiseId||null,premiseTypeId:input.typeId||null,objectId:input.objectId||null,areaMin:input.areaMin||null,areaMax:input.areaMax||null,priceMin:input.priceMin||null,priceMax:input.priceMax||null,status:input.status,note:input.note||null,updatedAt:new Date()};
  if(input.id)await db.update(s.waitlistEntries).set(values).where(eq(s.waitlistEntries.id,id));else await db.insert(s.waitlistEntries).values({id,...values});return{id};
}

export async function deleteWaitlist(id:string) {
  const actor=await requirePermission("waitlist.manage"),db=getDatabase();
  const entry=(await db.select().from(s.waitlistEntries).where(eq(s.waitlistEntries.id,id)).limit(1))[0];
  if(!entry)throw new Error("Запись листа ожидания не найдена");
  await db.transaction(async(tx)=>{await tx.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:"waitlist.deleted",entityType:"waitlist",entityId:id,before:entry});await tx.delete(s.waitlistEntries).where(eq(s.waitlistEntries.id,id))});
  return{ok:true};
}

export async function prepareWaitlistNotification(id:string){
  const actor=await requirePermission("waitlist.manage"),db=getDatabase();const entry=(await db.select().from(s.waitlistEntries).where(eq(s.waitlistEntries.id,id)).limit(1))[0];if(!entry)throw new Error("Запись не найдена");if(entry.status!=="active")throw new Error("Уведомление можно подготовить только для активной записи");if(!entry.userId)throw new Error("Для контакта без аккаунта уведомление в личном кабинете недоступно");
  const data=await waitlistAdmin(),item=data.items.find(x=>x.id===id);if(!item?.matches.length)throw new Error("Подходящих помещений пока нет");const notificationId=randomUUID(),titles=item.matches.map(x=>x.title).join(", ");
  const recipient=(await db.select({email:s.users.email}).from(s.users).where(eq(s.users.id,entry.userId)).limit(1))[0];
  await db.insert(s.announcements).values({id:notificationId,kind:"notification",title:"Подходящие помещения",subject:"Подходящие помещения RANG",body:`Подобраны варианты: ${titles}`,status:"draft",audience:{scope:"tenant",id:entry.userId,waitlistId:id},channels:recipient?.email?["in_app","email"]:["in_app"]});
  await db.insert(s.auditLogs).values({id:randomUUID(),actorUserId:actor.id,action:"waitlist.notification_prepared",entityType:"waitlist",entityId:id,after:{notificationId}});return{notificationId};
}
