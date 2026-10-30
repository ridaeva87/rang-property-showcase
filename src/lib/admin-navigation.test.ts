import { describe, expect, it } from "vitest";
import { ADMIN_NAV_SCROLL_KEY, isAdminNavigationActive, readAdminNavigationScroll, saveAdminNavigationScroll } from "./admin-navigation";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(ADMIN_NAV_SCROLL_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("admin navigation", () => {
  it("marks only the current admin section as active", () => {
    expect(isAdminNavigationActive("/admin", "/admin")).toBe(true);
    expect(isAdminNavigationActive("/admin/requests", "/admin")).toBe(false);
    expect(isAdminNavigationActive("/admin/requests", "/admin/requests")).toBe(true);
    expect(isAdminNavigationActive("/admin/premises/upload", "/admin/premises")).toBe(true);
    expect(isAdminNavigationActive("/admin/premises", "/admin/requests")).toBe(false);
  });

  it("saves and restores horizontal scroll position", () => {
    const storage = memoryStorage();
    saveAdminNavigationScroll(storage, 347.6);
    expect(readAdminNavigationScroll(storage)).toBe(348);
  });

  it("ignores invalid stored positions", () => {
    expect(readAdminNavigationScroll(memoryStorage())).toBeNull();
    expect(readAdminNavigationScroll(memoryStorage("invalid"))).toBeNull();
    expect(readAdminNavigationScroll(memoryStorage("-4"))).toBeNull();
  });
});
