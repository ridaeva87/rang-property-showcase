import { describe, expect, it } from "vitest";
import { AUDIT_LOG_PERMISSION, auditActionLabel, auditEntityLabel } from "./audit-log";
import { hasPermission } from "@/server/requests/access";

describe("administrative audit log", () => {
  it("uses an existing read-only administrative permission", () => {
    expect(AUDIT_LOG_PERMISSION).toBe("statistics.view");
    expect(hasPermission([], ["statistics.view"], AUDIT_LOG_PERMISSION)).toBe(true);
    expect(hasPermission([], ["requests.view"], AUDIT_LOG_PERMISSION)).toBe(false);
    expect(hasPermission(["admin"], [], AUDIT_LOG_PERMISSION)).toBe(true);
  });

  it("presents known actions and entity types without hiding unknown values", () => {
    expect(auditActionLabel("faq.updated")).toBe("Изменение");
    expect(auditEntityLabel("premise")).toBe("Помещение");
    expect(auditActionLabel("custom.action")).toBe("custom.action");
    expect(auditEntityLabel("custom_entity")).toBe("custom_entity");
  });
});
