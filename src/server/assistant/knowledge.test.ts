import { describe, expect, it } from "vitest";
import { APPROVED_FAQ, detectAssistantIntent, parseAreaCriteria, requestCategoryForQuestion } from "./knowledge";

describe("grounded assistant knowledge routing", () => {
  it("extracts an area range without inventing criteria", () => {
    expect(parseAreaCriteria("Нужен склад от 100 до 150 м²")).toEqual({ min: 100, max: 150 });
  });

  it("routes confirmed technical intents", () => {
    expect(detectAssistantIntent("Есть ли в этом помещении 380 В?")).toBe("power_380");
    expect(requestCategoryForQuestion("Не работает розетка")).toMatchObject({ code: "electricity" });
  });

  it("does not ship unapproved FAQ answers", () => {
    expect(APPROVED_FAQ).toEqual([]);
  });
});
