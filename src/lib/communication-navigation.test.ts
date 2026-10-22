import { describe, expect, it } from "vitest";
import { communicationTabsForUser, preferredCommunicationHref } from "./communication-navigation";

describe("unified communication navigation", () => {
  it("shows one entry point for an administrator while preserving all existing modes", () => {
    const user = { roles: ["admin"], permissions: [] };
    expect(preferredCommunicationHref(user)).toBe("/admin/notifications");
    expect(communicationTabsForUser(user).map((tab) => tab.kind)).toEqual(["notification", "mailing", "announcement"]);
  });

  it("uses the first mode actually available to an employee", () => {
    const user = { roles: [], permissions: ["mailings.manage"] };
    expect(preferredCommunicationHref(user)).toBe("/admin/mailings");
    expect(communicationTabsForUser(user).map((tab) => tab.kind)).toEqual(["mailing"]);
  });

  it("does not expose communication navigation without a matching permission", () => {
    const user = { roles: [], permissions: ["requests.view"] };
    expect(preferredCommunicationHref(user)).toBeUndefined();
    expect(communicationTabsForUser(user)).toEqual([]);
  });
});
