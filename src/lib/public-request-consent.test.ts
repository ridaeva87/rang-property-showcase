import { describe, expect, it } from "vitest";
import { publicRequestSchema } from "./admin.functions";

const request = {
  idempotencyKey: "0199d7c0-2eb5-7fb8-8f65-5c3890ced001",
  source: "rent" as const,
  subject: "Подбор помещения",
  name: "Посетитель",
  phone: "+7 900 000-00-00",
};

describe("homepage public request consent", () => {
  it("preserves an explicitly accepted consent for the request handler", () => {
    expect(publicRequestSchema.parse({ ...request, personalDataConsent: true })).toMatchObject({
      personalDataConsent: true,
    });
  });

  it("rejects submission without explicit consent", () => {
    expect(() => publicRequestSchema.parse(request)).toThrow();
    expect(() => publicRequestSchema.parse({ ...request, personalDataConsent: false })).toThrow(
      "Подтвердите согласие на обработку персональных данных",
    );
  });
});
