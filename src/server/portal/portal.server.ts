import { randomUUID } from "node:crypto";
import { and, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getDatabase } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  createOpaqueToken,
  hashPassword,
  hashToken,
  publicRequestStatus,
  validatePassword,
  verifyPassword,
} from "./security";

const COOKIE = "rang_session";
const SESSION_DAYS = 14;

export class AuthenticationError extends Error {}
export class AuthorizationError extends Error {}

export async function currentUser() {
  const raw = getCookie(COOKIE);
  if (!raw) return null;
  const db = getDatabase();
  const rows = await db
    .select({
      id: schema.users.id,
      kind: schema.users.kind,
      displayName: schema.users.displayName,
      email: schema.users.email,
      isActive: schema.users.isActive,
    })
    .from(schema.userSessions)
    .innerJoin(schema.users, eq(schema.userSessions.userId, schema.users.id))
    .where(
      and(
        eq(schema.userSessions.tokenHash, hashToken(raw)),
        isNull(schema.userSessions.revokedAt),
        gt(schema.userSessions.expiresAt, new Date()),
        eq(schema.users.isActive, true),
      ),
    )
    .limit(1);
  if (!rows[0]) return null;
  const roles = await db
    .select({ code: schema.roles.code })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, rows[0].id));
  return { ...rows[0], roles: roles.map((role) => role.code) };
}

export async function requireUser(kind?: "tenant" | "employee") {
  const user = await currentUser();
  if (!user) throw new AuthenticationError("Требуется вход");
  if (kind && user.kind !== kind) throw new AuthorizationError("Доступ запрещён");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("employee");
  if (!user.roles.includes("admin")) throw new AuthorizationError("Доступ запрещён");
  return user;
}

export async function login(email: string, password: string) {
  const db = getDatabase();
  const normalized = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);
  const user = rows[0];
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    throw new AuthenticationError("Неверный логин или пароль");
  }
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.transaction(async (tx) => {
    await tx
      .insert(schema.userSessions)
      .values({ id: randomUUID(), userId: user.id, tokenHash: hashToken(token), expiresAt });
    await tx
      .update(schema.users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
  });
  setCookie(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { kind: user.kind };
}

export async function logout() {
  const token = getCookie(COOKIE);
  if (token)
    await getDatabase()
      .update(schema.userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(schema.userSessions.tokenHash, hashToken(token)));
  deleteCookie(COOKIE, { path: "/" });
}

export async function consumeAccessToken(token: string, password: string) {
  validatePassword(password);
  const db = getDatabase();
  const rows = await db
    .select()
    .from(schema.userAccessTokens)
    .where(
      and(
        eq(schema.userAccessTokens.tokenHash, hashToken(token)),
        isNull(schema.userAccessTokens.usedAt),
        gt(schema.userAccessTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new AuthenticationError("Ссылка недействительна или истекла");
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({
        passwordHash: await hashPassword(password),
        passwordChangedAt: new Date(),
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, rows[0]!.userId));
    await tx
      .update(schema.userAccessTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.userAccessTokens.id, rows[0]!.id));
    await tx
      .update(schema.userSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(schema.userSessions.userId, rows[0]!.userId), isNull(schema.userSessions.revokedAt)),
      );
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  validatePassword(newPassword);
  const user = await requireUser();
  const db = getDatabase();
  const rows = await db
    .select({ hash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);
  if (!(await verifyPassword(currentPassword, rows[0]?.hash ?? null)))
    throw new AuthenticationError("Текущий пароль неверен");
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({
        passwordHash: await hashPassword(newPassword),
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
    await tx
      .update(schema.userSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(schema.userSessions.userId, user.id), isNull(schema.userSessions.revokedAt)));
  });
  deleteCookie(COOKIE, { path: "/" });
}

async function tenantOrganizationIds(userId: string) {
  const rows = await getDatabase()
    .select({ id: schema.organizationUsers.organizationId })
    .from(schema.organizationUsers)
    .where(eq(schema.organizationUsers.userId, userId));
  return rows.map((row) => row.id);
}

export async function portalOverview() {
  const user = await requireUser("tenant");
  const db = getDatabase();
  const direct = await db
    .select({
      id: schema.premises.id,
      slug: schema.premises.slug,
      title: schema.premises.title,
      area: schema.premises.areaSqm,
      address: schema.propertyObjects.address,
    })
    .from(schema.tenantPremises)
    .innerJoin(schema.premises, eq(schema.tenantPremises.premiseId, schema.premises.id))
    .innerJoin(schema.propertyObjects, eq(schema.premises.objectId, schema.propertyObjects.id))
    .where(eq(schema.tenantPremises.userId, user.id));
  const orgIds = await tenantOrganizationIds(user.id);
  const leased = orgIds.length
    ? await db
        .selectDistinct({
          id: schema.premises.id,
          slug: schema.premises.slug,
          title: schema.premises.title,
          area: schema.premises.areaSqm,
          address: schema.propertyObjects.address,
        })
        .from(schema.leaseContracts)
        .innerJoin(
          schema.leasePremises,
          eq(schema.leaseContracts.id, schema.leasePremises.contractId),
        )
        .innerJoin(schema.premises, eq(schema.leasePremises.premiseId, schema.premises.id))
        .innerJoin(schema.propertyObjects, eq(schema.premises.objectId, schema.propertyObjects.id))
        .where(
          and(
            inArray(schema.leaseContracts.organizationId, orgIds),
            eq(schema.leaseContracts.status, "active"),
          ),
        )
    : [];
  const premises = [...new Map([...direct, ...leased].map((p) => [p.id, p])).values()];
  const notifications = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, user.id))
    .orderBy(sql`${schema.notifications.createdAt} desc`);
  const requests = await db
    .select({
      id: schema.requests.id,
      subject: schema.requests.subject,
      description: schema.requests.description,
      createdAt: schema.requests.createdAt,
      statusCode: schema.requestStatuses.code,
      isClosed: schema.requestStatuses.isClosed,
      premiseId: schema.requests.premiseId,
      premiseTitle: schema.premises.title,
    })
    .from(schema.requests)
    .innerJoin(schema.requestStatuses, eq(schema.requests.statusId, schema.requestStatuses.id))
    .leftJoin(schema.premises, eq(schema.requests.premiseId, schema.premises.id))
    .where(eq(schema.requests.createdByUserId, user.id))
    .orderBy(sql`${schema.requests.createdAt} desc`);
  const requestIds = requests.map((request) => request.id);
  const comments = requestIds.length
    ? await db
        .select({
          id: schema.requestComments.id,
          requestId: schema.requestComments.requestId,
          body: schema.requestComments.body,
          createdAt: schema.requestComments.createdAt,
          authorId: schema.requestComments.authorUserId,
        })
        .from(schema.requestComments)
        .where(
          and(
            inArray(schema.requestComments.requestId, requestIds),
            eq(schema.requestComments.visibility, "public"),
          ),
        )
        .orderBy(schema.requestComments.createdAt)
    : [];
  const documents = orgIds.length
    ? await db
        .select({
          id: schema.documents.id,
          title: schema.documents.title,
          date: schema.documents.documentDate,
          type: schema.documentTypes.name,
        })
        .from(schema.documents)
        .innerJoin(schema.documentTypes, eq(schema.documents.typeId, schema.documentTypes.id))
        .where(inArray(schema.documents.organizationId, orgIds))
        .orderBy(sql`${schema.documents.documentDate} desc nulls last`)
    : [];
  return {
    user,
    premises,
    notifications,
    requests: requests.map((r) => ({
      ...r,
      publicStatus: publicRequestStatus(r.statusCode, r.isClosed),
      comments: comments
        .filter((comment) => comment.requestId === r.id)
        .map((comment) => ({ ...comment, mine: comment.authorId === user.id })),
    })),
    documents,
  };
}

export async function markNotificationRead(id: string) {
  const user = await requireUser("tenant");
  await getDatabase()
    .update(schema.notifications)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, user.id)));
}

export async function createTenantRequest(input: {
  premiseId?: string;
  category: string;
  subject: string;
  description: string;
}) {
  const user = await requireUser("tenant");
  const db = getDatabase();
  if (input.premiseId) {
    const overview = await portalOverview();
    if (!overview.premises.some((p) => p.id === input.premiseId))
      throw new AuthorizationError("Помещение недоступно");
  }
  const [category] = await db
    .select()
    .from(schema.requestCategories)
    .where(eq(schema.requestCategories.code, input.category))
    .limit(1);
  const [status] = await db
    .select()
    .from(schema.requestStatuses)
    .where(eq(schema.requestStatuses.code, "accepted"))
    .limit(1);
  if (!category || !status) throw new Error("Справочники заявок не настроены");
  const [orgId] = await tenantOrganizationIds(user.id);
  const id = randomUUID();
  await db.insert(schema.requests).values({
    id,
    organizationId: orgId,
    createdByUserId: user.id,
    categoryId: category.id,
    statusId: status.id,
    premiseId: input.premiseId || null,
    subject: input.subject,
    description: input.description,
  });
  return { id };
}

export async function addRequestComment(requestId: string, body: string) {
  const user = await requireUser("tenant");
  const owned = await getDatabase()
    .select({ id: schema.requests.id })
    .from(schema.requests)
    .where(and(eq(schema.requests.id, requestId), eq(schema.requests.createdByUserId, user.id)))
    .limit(1);
  if (!owned[0]) throw new AuthorizationError("Обращение недоступно");
  await getDatabase()
    .insert(schema.requestComments)
    .values({ id: randomUUID(), requestId, authorUserId: user.id, visibility: "public", body });
}

export async function getDocumentForCurrentTenant(id: string) {
  const user = await requireUser("tenant");
  const orgIds = await tenantOrganizationIds(user.id);
  if (!orgIds.length) throw new AuthorizationError("Документ недоступен");
  const rows = await getDatabase()
    .select({
      url: schema.mediaAssets.publicUrl,
      title: schema.documents.title,
      mime: schema.mediaAssets.mimeType,
    })
    .from(schema.documents)
    .innerJoin(schema.mediaAssets, eq(schema.documents.mediaId, schema.mediaAssets.id))
    .where(and(eq(schema.documents.id, id), inArray(schema.documents.organizationId, orgIds)))
    .limit(1);
  if (!rows[0]?.url) throw new AuthorizationError("Документ недоступен");
  return { ...rows[0], url: rows[0].url };
}

export async function listTenantsAdmin() {
  await requireAdmin();
  const db = getDatabase();
  const tenants = await db
    .select({
      id: schema.users.id,
      name: schema.users.displayName,
      email: schema.users.email,
      active: schema.users.isActive,
    })
    .from(schema.users)
    .where(eq(schema.users.kind, "tenant"))
    .orderBy(schema.users.displayName);
  const links = await db
    .select({ userId: schema.tenantPremises.userId, premiseId: schema.tenantPremises.premiseId })
    .from(schema.tenantPremises);
  const premises = await db
    .select({ id: schema.premises.id, title: schema.premises.title })
    .from(schema.premises)
    .orderBy(schema.premises.title);
  return {
    tenants: tenants.map((t) => ({
      ...t,
      premiseIds: links.filter((l) => l.userId === t.id).map((l) => l.premiseId),
    })),
    premises,
  };
}

export async function saveTenantAdmin(input: {
  id?: string;
  name: string;
  email: string;
  active: boolean;
  premiseIds: string[];
}) {
  await requireAdmin();
  const db = getDatabase();
  const id = input.id || randomUUID();
  const email = input.email.trim().toLowerCase();
  let activationToken: string | undefined;
  await db.transaction(async (tx) => {
    if (input.id)
      await tx
        .update(schema.users)
        .set({ displayName: input.name, email, isActive: input.active, updatedAt: new Date() })
        .where(and(eq(schema.users.id, id), eq(schema.users.kind, "tenant")));
    else {
      await tx
        .insert(schema.users)
        .values({ id, kind: "tenant", email, displayName: input.name, isActive: input.active });
      await tx
        .insert(schema.userRoles)
        .values({ userId: id, roleId: "role-tenant" })
        .onConflictDoNothing();
      activationToken = createOpaqueToken();
      await tx.insert(schema.userAccessTokens).values({
        id: randomUUID(),
        userId: id,
        purpose: "activation",
        tokenHash: hashToken(activationToken),
        expiresAt: new Date(Date.now() + 72 * 3600000),
      });
    }
    await tx.delete(schema.tenantPremises).where(eq(schema.tenantPremises.userId, id));
    if (input.premiseIds.length)
      await tx
        .insert(schema.tenantPremises)
        .values(input.premiseIds.map((premiseId) => ({ userId: id, premiseId })));
    if (!input.active)
      await tx
        .update(schema.userSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(schema.userSessions.userId, id), isNull(schema.userSessions.revokedAt)));
  });
  return {
    id,
    activationPath: activationToken ? `/account/activate?token=${activationToken}` : undefined,
  };
}

export async function issuePasswordResetAdmin(userId: string) {
  await requireAdmin();
  const db = getDatabase();
  const user = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.id, userId), eq(schema.users.kind, "tenant")))
    .limit(1);
  if (!user[0]) throw new Error("Арендатор не найден");
  const token = createOpaqueToken();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.userAccessTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(schema.userAccessTokens.userId, userId),
          eq(schema.userAccessTokens.purpose, "password_reset"),
          isNull(schema.userAccessTokens.usedAt),
        ),
      );
    await tx.insert(schema.userAccessTokens).values({
      id: randomUUID(),
      userId,
      purpose: "password_reset",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 2 * 3600000),
    });
  });
  return { activationPath: `/account/activate?token=${token}` };
}

export async function listRequestsAdmin() {
  await requireAdmin();
  const db = getDatabase();
  const requests = await db
    .select({
      id: schema.requests.id,
      subject: schema.requests.subject,
      description: schema.requests.description,
      createdAt: schema.requests.createdAt,
      tenant: schema.users.displayName,
      premise: schema.premises.title,
      status: schema.requestStatuses.code,
    })
    .from(schema.requests)
    .leftJoin(schema.users, eq(schema.requests.createdByUserId, schema.users.id))
    .leftJoin(schema.premises, eq(schema.requests.premiseId, schema.premises.id))
    .innerJoin(schema.requestStatuses, eq(schema.requests.statusId, schema.requestStatuses.id))
    .orderBy(sql`${schema.requests.createdAt} desc`);
  const ids = requests.map((request) => request.id);
  const comments = ids.length
    ? await db
        .select({
          id: schema.requestComments.id,
          requestId: schema.requestComments.requestId,
          body: schema.requestComments.body,
          visibility: schema.requestComments.visibility,
          createdAt: schema.requestComments.createdAt,
        })
        .from(schema.requestComments)
        .where(inArray(schema.requestComments.requestId, ids))
        .orderBy(schema.requestComments.createdAt)
    : [];
  return requests.map((request) => ({
    ...request,
    comments: comments.filter((comment) => comment.requestId === request.id),
  }));
}

export async function updateRequestAdmin(input: {
  requestId: string;
  status: "accepted" | "in_progress" | "completed";
  comment?: string;
  visibility?: "public" | "internal";
}) {
  const admin = await requireAdmin();
  const db = getDatabase();
  const [next] = await db
    .select({ id: schema.requestStatuses.id })
    .from(schema.requestStatuses)
    .where(eq(schema.requestStatuses.code, input.status))
    .limit(1);
  const [request] = await db
    .select({ statusId: schema.requests.statusId })
    .from(schema.requests)
    .where(eq(schema.requests.id, input.requestId))
    .limit(1);
  if (!next || !request) throw new Error("Заявка не найдена");
  await db.transaction(async (tx) => {
    if (request.statusId !== next.id) {
      await tx
        .update(schema.requests)
        .set({ statusId: next.id, updatedAt: new Date() })
        .where(eq(schema.requests.id, input.requestId));
      await tx.insert(schema.requestStatusHistory).values({
        id: randomUUID(),
        requestId: input.requestId,
        fromStatusId: request.statusId,
        toStatusId: next.id,
        changedByUserId: admin.id,
      });
    }
    if (input.comment?.trim())
      await tx.insert(schema.requestComments).values({
        id: randomUUID(),
        requestId: input.requestId,
        authorUserId: admin.id,
        visibility: input.visibility || "public",
        body: input.comment.trim(),
      });
  });
}

export async function notifyTenantAdmin(input: { userId: string; title: string; body: string }) {
  await requireAdmin();
  const tenant = await getDatabase()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.id, input.userId), eq(schema.users.kind, "tenant")))
    .limit(1);
  if (!tenant[0]) throw new Error("Арендатор не найден");
  await getDatabase().insert(schema.notifications).values({
    id: randomUUID(),
    userId: input.userId,
    title: input.title,
    body: input.body,
    channel: "in_app",
    deliveredAt: new Date(),
  });
}
