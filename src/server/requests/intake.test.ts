import { describe, expect, it } from "vitest";
import { requestCategoryForIntake } from "./intake.server";

describe("request intake routing", () => {
  it.each([
    ["refit", "refit"],
    ["technical", "repair"],
    ["electrical", "electricity"],
    ["plumbing", "plumbing"],
    ["power", "electricity"],
    ["loading", "loading"],
    ["other", "other"],
  ])("maps service %s to request category %s", (serviceId, category) => {
    expect(requestCategoryForIntake({ serviceId })).toBe(category);
  });

  it("keeps an explicitly selected request category", () => {
    expect(requestCategoryForIntake({ categoryCode: "legal", serviceId: "technical" })).toBe("legal");
  });

  it("uses the existing fallback category", () => {
    expect(requestCategoryForIntake({})).toBe("other");
  });
});
