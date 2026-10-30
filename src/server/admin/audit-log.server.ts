import { desc, eq } from "drizzle-orm";
import { AUDIT_LOG_PERMISSION } from "@/lib/audit-log";
import { getDatabase } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { requirePermission } from "@/server/portal/portal.server";

export async function auditLogAdmin() {
  await requirePermission(AUDIT_LOG_PERMISSION);
  return getDatabase()
    .select({
      id: schema.auditLogs.id,
      occurredAt: schema.auditLogs.occurredAt,
      actor: schema.users.displayName,
      action: schema.auditLogs.action,
      entityType: schema.auditLogs.entityType,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.auditLogs.actorUserId, schema.users.id))
    .orderBy(desc(schema.auditLogs.occurredAt))
    .limit(200);
}
