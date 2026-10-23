import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminOperationDeletePermission,
  adminOperationDeleteSectionSchema,
  adminOperationReadPermission,
  adminOperationReadSectionSchema,
  legacyAdminOperationSectionSchema,
} from "@/lib/admin-operation-sections";

const dependencies = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  requirePermission: vi.fn(),
  sendProjectEmail: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ getDatabase: dependencies.getDatabase }));
vi.mock("@/server/portal/portal.server", () => ({ requirePermission: dependencies.requirePermission }));
vi.mock("@/server/portal/email.server", () => ({ sendProjectEmail: dependencies.sendProjectEmail }));

import { adminOperations, createAdminOperation, deleteAdminOperation } from "./admin.server";

describe("legacy mailing path", () => {
  beforeEach(() => vi.clearAllMocks());

  it("excludes mailings from the old server-function validator", () => {
    expect(legacyAdminOperationSectionSchema.safeParse("mailings").success).toBe(false);
    expect(legacyAdminOperationSectionSchema.options).toEqual(["leads", "services", "ads"]);
  });

  it("rejects a direct mailing send before database access or Resend", async () => {
    await expect(createAdminOperation({
      section: "mailings",
      title: "Рассылка",
      detail: "Текст",
      send: true,
    })).rejects.toThrow("нельзя изменять через старый административный обработчик");

    expect(dependencies.requirePermission).not.toHaveBeenCalled();
    expect(dependencies.getDatabase).not.toHaveBeenCalled();
    expect(dependencies.sendProjectEmail).not.toHaveBeenCalled();
  });
});

describe("legacy admin operation access", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unknown read and delete sections instead of falling back to admin.access", async () => {
    expect(adminOperationReadSectionSchema.safeParse("employees").success).toBe(false);
    expect(adminOperationDeleteSectionSchema.safeParse("employees").success).toBe(false);
    expect(() => adminOperationReadPermission("employees")).toThrow("Недопустимый административный раздел");
    expect(() => adminOperationDeletePermission("employees")).toThrow("Удаление в этом административном разделе запрещено");
    await expect(adminOperations("employees")).rejects.toThrow("Недопустимый административный раздел");
    await expect(deleteAdminOperation({ section: "employees", id: "employee-id" })).rejects.toThrow("Удаление в этом административном разделе запрещено");
    expect(dependencies.requirePermission).not.toHaveBeenCalled();
    expect(dependencies.getDatabase).not.toHaveBeenCalled();
  });

  it("maps permitted operations to their explicit existing permissions", () => {
    expect(adminOperationReadPermission("support")).toBe("support.manage");
    expect(adminOperationReadPermission("statistics")).toBe("statistics.view");
    expect(adminOperationDeletePermission("leads")).toBe("leads.manage");
    expect(adminOperationDeletePermission("services")).toBe("services.manage");
    expect(adminOperationDeletePermission("ads")).toBe("ads.manage");
  });
});
