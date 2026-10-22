import { describe, expect, it } from "vitest";
import { preferredCommunicationHref } from "./communication-navigation";

describe("unified communication navigation", () => {
  it("uses the existing mailing form as the single main notifications section", () => {
    const user = { roles: ["admin"], permissions: [] };
    expect(preferredCommunicationHref(user)).toBe("/admin/mailings");
  });

  it("keeps the main section available to a mailing manager", () => {
    const user = { roles: [], permissions: ["mailings.manage"] };
    expect(preferredCommunicationHref(user)).toBe("/admin/mailings");
  });

  it("preserves a permitted legacy URL when mailing access is absent", () => {
    expect(preferredCommunicationHref({ roles: [], permissions: ["notifications.manage"] })).toBe("/admin/notifications");
    expect(preferredCommunicationHref({ roles: [], permissions: ["announcements.manage"] })).toBe("/admin/announcements");
  });

  it("does not expose communication navigation without a matching permission", () => {
    const user = { roles: [], permissions: ["requests.view"] };
    expect(preferredCommunicationHref(user)).toBeUndefined();
  });
});
