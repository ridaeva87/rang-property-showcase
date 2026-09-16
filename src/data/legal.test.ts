import { describe, expect, it } from "vitest";
import { PERSONAL_DATA_CONSENT, PRIVACY_POLICY } from "./legal";

describe("published legal documents", () => {
  it("contains the configured site, policy URL and official email without blank fields", () => {
    const text = [...PRIVACY_POLICY.paragraphs, ...PERSONAL_DATA_CONSENT.paragraphs].join("\n");
    expect(text).toContain("https://rangpro.ru");
    expect(text).toContain("https://rangpro.ru/privacy-policy");
    expect(text).toContain("noreply@rangpro.ru");
    expect(text).not.toMatch(/_{5,}/);
  });
});
