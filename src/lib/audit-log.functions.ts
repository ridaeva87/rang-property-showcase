import { createServerFn } from "@tanstack/react-start";

export const loadAuditLogAdmin = createServerFn({ method: "GET" }).handler(async () =>
  (await import("@/server/admin/audit-log.server")).auditLogAdmin(),
);
