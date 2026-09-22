import { describe, expect, it } from "vitest";
import { interestNote, PUBLIC_INTEREST_LABELS } from "./property-interest.server";

describe("public property interests", () => {
  it("maps every public CTA to the existing interest model", () => {
    expect(PUBLIC_INTEREST_LABELS.viewing).toMatchObject({ kind: "viewing", cta: "Записаться на просмотр" });
    expect(PUBLIC_INTEREST_LABELS.application.kind).toBe("application");
    expect(PUBLIC_INTEREST_LABELS["release-notification"].kind).toBe("release_waitlist");
    expect(PUBLIC_INTEREST_LABELS.details.kind).toBe("details");
  });
  it("identifies assistant questions without losing their text", () => {
    expect(PUBLIC_INTEREST_LABELS.question.source).toBe("Помощник RANG");
    expect(interestNote("Когда можно посмотреть?", "Задать вопрос")).toContain("Когда можно посмотреть?");
  });
});
