import { beforeEach, describe, expect, it, vi } from "vitest";
import { legacyAdminOperationSectionSchema } from "@/lib/admin-operation-sections";

const dependencies = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  requirePermission: vi.fn(),
  sendProjectEmail: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ getDatabase: dependencies.getDatabase }));
vi.mock("@/server/portal/portal.server", () => ({ requirePermission: dependencies.requirePermission }));
vi.mock("@/server/portal/email.server", () => ({ sendProjectEmail: dependencies.sendProjectEmail }));

import { createAdminOperation } from "./admin.server";

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
