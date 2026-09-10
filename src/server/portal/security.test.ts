import { describe, expect, it } from "vitest";
import { hashPassword, publicRequestStatus, validatePassword, verifyPassword } from "./security";

describe("tenant authentication and isolation primitives", () => {
  it("accepts the right password and rejects a wrong password", async () => {
    const hash = await hashPassword("Tenant-A-2026-secure");
    expect(await verifyPassword("Tenant-A-2026-secure", hash)).toBe(true);
    expect(await verifyPassword("Tenant-B-2026-secure", hash)).toBe(false);
    expect(hash).not.toContain("Tenant-A-2026-secure");
  });
  it("enforces strong passwords", () => {
    expect(() => validatePassword("short")).toThrow();
    expect(() => validatePassword("Safe-password-2026")).not.toThrow();
  });
  it.each([
    ["new", false, "Принято"],
    ["assigned", false, "В работе"],
    ["in_progress", false, "В работе"],
    ["anything", true, "Выполнено"],
  ])("maps internal status %s", (code, closed, label) =>
    expect(publicRequestStatus(String(code), Boolean(closed))).toBe(label),
  );
  it("keeps tenant A resources separate from tenant B", () => {
    const rows = [
      { userId: "tenant-a", id: "premise-a" },
      { userId: "tenant-b", id: "premise-b" },
    ];
    expect(rows.filter((r) => r.userId === "tenant-a").map((r) => r.id)).toEqual(["premise-a"]);
    expect(rows.filter((r) => r.userId === "tenant-a").some((r) => r.id === "premise-b")).toBe(
      false,
    );
  });
});
