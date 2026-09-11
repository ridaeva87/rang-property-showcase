import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentials = z.object({ email: z.string().email(), password: z.string().min(1) });
const passwordChange = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
});
const requestInput = z.object({
  premiseId: z.string().optional(),
  category: z.string().min(1),
  subject: z.string().min(3).max(160),
  description: z.string().min(5).max(5000),
});

export const getCurrentAccount = createServerFn({ method: "GET" }).handler(async () => {
  const { currentUser } = await import("@/server/portal/portal.server");
  return currentUser();
});

export const loginAccount = createServerFn({ method: "POST" })
  .validator(credentials)
  .handler(async ({ data }) => {
    const { login } = await import("@/server/portal/portal.server");
    return login(data.email, data.password);
  });

export const logoutAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { logout } = await import("@/server/portal/portal.server");
  await logout();
  return { ok: true };
});

export const activateAccount = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(32), password: z.string().min(12) }))
  .handler(async ({ data }) => {
    const { consumeAccessToken } = await import("@/server/portal/portal.server");
    await consumeAccessToken(data.token, data.password, "activation");
    return { ok: true };
  });

export const changeAccountPassword = createServerFn({ method: "POST" })
  .validator(passwordChange)
  .handler(async ({ data }) => {
    const { changePassword } = await import("@/server/portal/portal.server");
    await changePassword(data.currentPassword, data.newPassword);
    return { ok: true };
  });

export const requestAccountPasswordReset = createServerFn({ method: "POST" }).validator(z.object({ email: z.string().email() })).handler(async ({ data }) => {
  const { requestPasswordReset } = await import("@/server/portal/portal.server");
  await requestPasswordReset(data.email);
  return { ok: true };
});

export const resetAccountPassword = createServerFn({ method: "POST" }).validator(z.object({ token: z.string().min(32), password: z.string().min(12) })).handler(async ({ data }) => {
  const { consumeAccessToken } = await import("@/server/portal/portal.server");
  await consumeAccessToken(data.token, data.password, "password_reset");
  return { ok: true };
});

export const loadPortal = createServerFn({ method: "GET" }).handler(async () => {
  const { portalOverview } = await import("@/server/portal/portal.server");
  return portalOverview();
});

export const readPortalNotification = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { markNotificationRead } = await import("@/server/portal/portal.server");
    await markNotificationRead(data.id);
    return { ok: true };
  });

export const submitPortalRequest = createServerFn({ method: "POST" })
  .validator(requestInput)
  .handler(async ({ data }) => {
    const { createTenantRequest } = await import("@/server/portal/portal.server");
    const { premiseId, ...request } = data;
    return createTenantRequest(premiseId ? { ...request, premiseId } : request);
  });

export const commentPortalRequest = createServerFn({ method: "POST" })
  .validator(z.object({ requestId: z.string().uuid(), body: z.string().min(1).max(5000) }))
  .handler(async ({ data }) => {
    const { addRequestComment } = await import("@/server/portal/portal.server");
    await addRequestComment(data.requestId, data.body);
    return { ok: true };
  });

export const loadTenantAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { listTenantsAdmin } = await import("@/server/portal/portal.server");
  return listTenantsAdmin();
});

export const saveTenant = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(2),
      email: z.string().email(),
      active: z.boolean(),
      premiseIds: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const { saveTenantAdmin } = await import("@/server/portal/portal.server");
    const { id, ...tenant } = data;
    return saveTenantAdmin(id ? { ...tenant, id } : tenant);
  });

export const resetTenantPassword = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { issuePasswordResetAdmin } = await import("@/server/portal/portal.server");
    return issuePasswordResetAdmin(data.userId);
  });

export const resendTenantActivation = createServerFn({ method: "POST" }).validator(z.object({ userId: z.string().uuid() })).handler(async ({ data }) => {
  const { resendActivationAdmin } = await import("@/server/portal/portal.server");
  return resendActivationAdmin(data.userId);
});

export const loadDocumentsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { listDocumentsAdmin } = await import("@/server/portal/portal.server");
  return listDocumentsAdmin();
});

export const deactivateDocument = createServerFn({ method: "POST" }).validator(z.object({ id: z.string().uuid() })).handler(async ({ data }) => {
  const { deactivateDocumentAdmin } = await import("@/server/portal/portal.server");
  await deactivateDocumentAdmin(data.id); return { ok: true };
});

export const loadRequestsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { listRequestsAdmin } = await import("@/server/portal/portal.server");
  return listRequestsAdmin();
});

export const updateRequest = createServerFn({ method: "POST" })
  .validator(
    z.object({
      requestId: z.string().uuid(),
      status: z.enum(["accepted", "in_progress", "completed"]),
      direction: z.enum(["technical", "management", "accounting", "legal", "documents", "access", "other"]),
      assigneeEmployeeId: z.string().nullable().optional(),
      comment: z.string().max(5000).optional(),
      visibility: z.enum(["public", "internal"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { updateRequestAdmin } = await import("@/server/portal/portal.server");
    const { comment, visibility, assigneeEmployeeId, ...request } = data;
    await updateRequestAdmin({
      ...request,
      ...(comment ? { comment } : {}),
      ...(visibility ? { visibility } : {}),
      ...(assigneeEmployeeId !== undefined ? { assigneeEmployeeId } : {}),
    });
    return { ok: true };
  });

export const notifyTenant = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().uuid(),
      title: z.string().min(2).max(160),
      body: z.string().min(2).max(5000),
    }),
  )
  .handler(async ({ data }) => {
    const { notifyTenantAdmin } = await import("@/server/portal/portal.server");
    await notifyTenantAdmin(data);
    return { ok: true };
  });
