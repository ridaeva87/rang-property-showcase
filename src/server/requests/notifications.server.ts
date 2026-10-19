import { and, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { sendRequestNotificationEmail } from "@/server/portal/email.server";
import { hasPermission, requestDirectionScope } from "./access";

export type RequestStaffNotification = {
  requestId: string;
  eventTitle: string;
  fallbackWhenUnassigned: boolean;
};

export type RequestNotificationRecipient = {
  employeeId: string;
  userId: string;
  email: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
};

export function canReceiveRequestNotification(
  recipient: RequestNotificationRecipient,
  directionCode: string,
) {
  if (!recipient.isActive || !recipient.email?.trim()) return false;
  if (!hasPermission(recipient.roles, recipient.permissions, "requests.manage")) return false;
  const scope = requestDirectionScope(recipient.roles);
  return scope === null || scope.includes(directionCode);
}

export async function deliverRequestNotification(
  recipients: RequestNotificationRecipient[],
  input: { requestNumber: number; eventTitle: string },
  send = sendRequestNotificationEmail,
) {
  const unique = new Map<string, RequestNotificationRecipient>();
  for (const recipient of recipients) {
    const email = recipient.email?.trim().toLowerCase();
    if (email && !unique.has(email)) unique.set(email, recipient);
  }
  const results = await Promise.allSettled(
    [...unique.values()].map((recipient) =>
      send({ to: recipient.email!.trim(), requestNumber: input.requestNumber, eventTitle: input.eventTitle }),
    ),
  );
  return {
    sent: results.filter((result) => result.status === "fulfilled" && result.value).length,
    failed: results.filter((result) => result.status === "rejected" || !result.value).length,
  };
}

async function eligibleRecipients(input: {
  directionCode: string;
  employeeId?: string | null;
}) {
  const db = getDatabase();
  const staff = await db
    .select({
      employeeId: schema.employees.id,
      userId: schema.users.id,
      email: schema.users.email,
      isActive: schema.users.isActive,
    })
    .from(schema.employees)
    .innerJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(
      and(
        eq(schema.users.kind, "employee"),
        eq(schema.users.isActive, true),
        input.employeeId ? eq(schema.employees.id, input.employeeId) : undefined,
      ),
    );
  const userIds = staff.map((employee) => employee.userId);
  if (!userIds.length) return [];
  const roleRows = await db
    .select({ userId: schema.userRoles.userId, code: schema.roles.code })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(inArray(schema.userRoles.userId, userIds));
  const permissionRows = await db
    .select({ userId: schema.userRoles.userId, code: schema.permissions.code })
    .from(schema.userRoles)
    .innerJoin(schema.rolePermissions, eq(schema.userRoles.roleId, schema.rolePermissions.roleId))
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(inArray(schema.userRoles.userId, userIds));
  return staff
    .map((employee) => ({
      ...employee,
      roles: roleRows.filter((row) => row.userId === employee.userId).map((row) => row.code),
      permissions: permissionRows.filter((row) => row.userId === employee.userId).map((row) => row.code),
    }))
    .filter((employee) => canReceiveRequestNotification(employee, input.directionCode));
}

export async function notifyRequestStaff(input: RequestStaffNotification) {
  const db = getDatabase();
  const [request] = await db
    .select({
      requestNumber: schema.requests.requestNumber,
      assigneeEmployeeId: schema.requests.assigneeEmployeeId,
      directionCode: schema.requestDirections.code,
    })
    .from(schema.requests)
    .innerJoin(schema.requestDirections, eq(schema.requests.directionId, schema.requestDirections.id))
    .where(eq(schema.requests.id, input.requestId))
    .limit(1);
  if (!request) return { sent: 0, failed: 0 };
  if (!request.assigneeEmployeeId && !input.fallbackWhenUnassigned) return { sent: 0, failed: 0 };
  const recipients = await eligibleRecipients({
    directionCode: request.directionCode,
    employeeId: request.assigneeEmployeeId,
  });
  return deliverRequestNotification(recipients, {
    requestNumber: request.requestNumber,
    eventTitle: input.eventTitle,
  });
}

export async function notifyRequestStaffSafely(input: RequestStaffNotification) {
  try {
    const result = await notifyRequestStaff(input);
    if (result.failed) console.error("Не удалось отправить email-уведомление по заявке", input.requestId);
    return result;
  } catch {
    console.error("Ошибка email-уведомления по заявке", input.requestId);
    return { sent: 0, failed: 1 };
  }
}

export async function notifyCreatedRequest(
  input: { id: string; created: boolean },
  notify = notifyRequestStaffSafely,
) {
  if (!input.created) return false;
  await notify({
    requestId: input.id,
    eventTitle: "Создана новая заявка",
    fallbackWhenUnassigned: true,
  });
  return true;
}
