import { describe, expect, it } from "vitest";
import { FAQ } from "@/data/rang";
import { FAQ_MANAGE_PERMISSION, faqItemInputSchema, mergePublishedFaq, moveFaqOrder } from "./faq";
import { hasPermission } from "@/server/requests/access";

describe("FAQ management", () => {
  it("keeps the existing questions available and avoids duplicates during gradual transfer", () => {
    const firstLegacy = FAQ[0]!;
    const stored = [{
      id: "stored-1",
      question: firstLegacy.q,
      answer: "Подтверждённый ответ",
      category: "Аренда",
      displayOrder: 0,
    }];
    const result = mergePublishedFaq(stored);
    expect(result.filter((item) => item.question === firstLegacy.q)).toHaveLength(1);
    expect(result).toHaveLength(FAQ.length);
    expect(result.some((item) => item.legacy)).toBe(true);
  });

  it("changes order without losing FAQ entries", () => {
    expect(moveFaqOrder(["one", "two", "three"], "two", "up")).toEqual(["two", "one", "three"]);
    expect(moveFaqOrder(["one", "two", "three"], "three", "down")).toEqual(["one", "two", "three"]);
  });

  it("validates required FAQ fields and publication status", () => {
    expect(faqItemInputSchema.safeParse({ question: "Вопрос?", answer: "Ответ", category: "Общее", publicationStatus: "published" }).success).toBe(true);
    expect(faqItemInputSchema.safeParse({ question: "", answer: "", category: "", publicationStatus: "published" }).success).toBe(false);
  });

  it("uses the existing services permission without adding roles", () => {
    expect(FAQ_MANAGE_PERMISSION).toBe("services.manage");
    expect(hasPermission([], ["services.manage"], FAQ_MANAGE_PERMISSION)).toBe(true);
    expect(hasPermission([], ["requests.manage"], FAQ_MANAGE_PERMISSION)).toBe(false);
  });
});
