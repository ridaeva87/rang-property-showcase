import { describe, expect, it } from "vitest";
import { requestCategoryForIntake, requestIdempotencyDigest } from "./intake.server";

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

describe("request idempotency scope", () => {
  const key = "0199d7c0-2eb5-7fb8-8f65-5c3890ced001";

  it("keeps retries in one authenticated scope stable", () => {
    expect(requestIdempotencyDigest("user:tenant-a:portal-request", key)).toBe(
      requestIdempotencyDigest("user:tenant-a:portal-request", key),
    );
  });

  it("does not expose a request across tenants or intake sources", () => {
    expect(requestIdempotencyDigest("user:tenant-a:portal-request", key)).not.toBe(
      requestIdempotencyDigest("user:tenant-b:portal-request", key),
    );
    expect(requestIdempotencyDigest("user:tenant-a:portal-request", key)).not.toBe(
      requestIdempotencyDigest("user:tenant-a:assistant:general", key),
    );
  });

  it("rejects malformed keys on the server", () => {
    expect(() => requestIdempotencyDigest("public:form", "not-a-uuid")).toThrow(
      "Некорректный ключ отправки заявки",
    );
  });
});
