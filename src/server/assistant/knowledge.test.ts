import { describe, expect, it } from "vitest";
import { APPROVED_FAQ, detectAssistantIntent, isConfirmedAvailable, isConfirmedPositive, parseAreaCriteria, requestCategoryForQuestion } from "./knowledge";

describe("grounded assistant knowledge routing", () => {
  it("extracts an area range without inventing criteria", () => {
    expect(parseAreaCriteria("Нужен склад от 100 до 150 м²")).toEqual({ min: 100, max: 150 });
  });

  it("routes confirmed technical intents", () => {
    expect(detectAssistantIntent("Есть ли в этом помещении 380 В?")).toBe("power_380");
    expect(requestCategoryForQuestion("Не работает розетка")).toMatchObject({ code: "electricity" });
  });

  it("routes tenant-owned data intents before generic catalog search", () => {
    expect(detectAssistantIntent("Какие помещения у меня арендуются?")).toBe("tenant_premises");
    expect(detectAssistantIntent("Покажи мои заявки")).toBe("tenant_requests");
    expect(detectAssistantIntent("Покажи свободные склады")).toBe("search");
  });

  it("uses confirmed availability and electrical values, including legacy published rows", () => {
    expect(isConfirmedAvailable({ statusCode: null, statusName: null, isAvailable: null })).toBe(true);
    expect(isConfirmedAvailable({ statusCode: "occupied", statusName: "Сдано", isAvailable: false })).toBe(false);
    expect(isConfirmedPositive("Есть")).toBe(true);
    expect(isConfirmedPositive("220/380 В")).toBe(true);
  });

  it("does not ship unapproved FAQ answers", () => {
    expect(APPROVED_FAQ).toEqual([]);
  });
});
