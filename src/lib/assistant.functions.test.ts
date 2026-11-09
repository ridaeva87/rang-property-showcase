import { describe, expect, it } from "vitest";
import { transferRangAssistantQuestionSchema } from "./assistant.functions";

const validInput = {
  idempotencyKey: "0199d7c0-2eb5-7fb8-8f65-5c3890ced001",
  question: "Нужна консультация по помещению",
  name: "Посетитель",
  phone: "+7 900 000-00-00",
  source: "public" as const,
};

describe("public assistant transfer consent", () => {
  it("preserves an explicitly accepted consent for the server handler", () => {
    expect(
      transferRangAssistantQuestionSchema.parse({ ...validInput, personalDataConsent: true }),
    ).toMatchObject({ personalDataConsent: true });
  });

  it("rejects a public transfer without explicit consent", () => {
    expect(() => transferRangAssistantQuestionSchema.parse(validInput)).toThrow(
      "Подтвердите согласие на обработку персональных данных",
    );
    expect(() =>
      transferRangAssistantQuestionSchema.parse({ ...validInput, personalDataConsent: false }),
    ).toThrow("Подтвердите согласие на обработку персональных данных");
  });

  it("does not require public-form consent for an authenticated tenant transfer", () => {
    expect(
      transferRangAssistantQuestionSchema.parse({ ...validInput, source: "tenant_portal" }),
    ).toMatchObject({ source: "tenant_portal" });
  });
});
