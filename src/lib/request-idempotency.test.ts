import { describe, expect, it } from "vitest";
import { clearRequestIdempotencyKey, getOrCreateRequestIdempotencyKey } from "./request-idempotency";

describe("pending request idempotency keys", () => {
  it("keeps one key for a network retry and replaces it only after success", () => {
    const scope = `retry-${crypto.randomUUID()}`;
    const first = getOrCreateRequestIdempotencyKey(scope);
    expect(getOrCreateRequestIdempotencyKey(scope)).toBe(first);
    clearRequestIdempotencyKey(scope, first);
    expect(getOrCreateRequestIdempotencyKey(scope)).not.toBe(first);
  });

  it("gives independent submissions independent keys", () => {
    expect(getOrCreateRequestIdempotencyKey(`one-${crypto.randomUUID()}`)).not.toBe(
      getOrCreateRequestIdempotencyKey(`two-${crypto.randomUUID()}`),
    );
  });
});
