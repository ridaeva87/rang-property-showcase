import { describe, expect, it } from "vitest";
import {
  CONSENT_CONTACT_EMAIL,
  PERSONAL_DATA_CONSENT_VERSION,
  requirePersonalDataConsent,
} from "./consents";

describe("personal data consent evidence", () => {
  it("creates versioned evidence only after explicit confirmation", () => {
    expect(requirePersonalDataConsent(true, "public_form:test")).toEqual({
      source: "public_form:test",
      legalTextVersion: PERSONAL_DATA_CONSENT_VERSION,
    });
  });

  it("rejects a public submission without consent", () => {
    expect(() => requirePersonalDataConsent(false, "public_form:test")).toThrow(
      "Подтвердите согласие на обработку персональных данных",
    );
  });

  it("uses the confirmed consent contact", () => {
    expect(CONSENT_CONTACT_EMAIL).toBe("zaorang@mail.ru");
  });
});
