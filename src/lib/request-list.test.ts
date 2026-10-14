import { describe, expect, it } from "vitest";
import { filterAndSortRequests, requestsToCsv, type RequestListItem } from "./request-list";

const requests: RequestListItem[] = [
  {
    requestNumber: 12,
    subject: "Нужна электрика",
    description: "Проверить щиток",
    createdAt: "2026-09-02T10:00:00.000Z",
    tenant: "Компания Альфа",
    premise: "Офис №4",
    category: "Электрика",
    direction: "Техническое",
    status: "accepted",
    assignee: "Иван Иванов",
  },
  {
    requestNumber: 3,
    subject: "Вопрос по счёту",
    description: "Нужен акт; и сверка\nза месяц",
    createdAt: "2026-09-01T10:00:00.000Z",
    tenant: "ООО «Бета»",
    premise: null,
    category: "Бухгалтерия",
    direction: "Бухгалтерия",
    status: "completed",
    assignee: null,
  },
];

describe("admin request list", () => {
  it.each([
    ["000012", 12],
    ["ЭЛЕКТРИКА", 12],
    ["щиток", 12],
    ["альфа", 12],
    ["офис №4", 12],
  ])("searches by %s without case sensitivity", (query, number) => {
    expect(filterAndSortRequests(requests, query, "newest").map((item) => item.requestNumber)).toEqual([number]);
  });

  it("sorts newest and oldest without mutating the source", () => {
    expect(filterAndSortRequests(requests, "", "newest").map((item) => item.requestNumber)).toEqual([12, 3]);
    expect(filterAndSortRequests(requests, "", "oldest").map((item) => item.requestNumber)).toEqual([3, 12]);
    expect(requests.map((item) => item.requestNumber)).toEqual([12, 3]);
  });

  it("creates Excel-compatible UTF-8 CSV with escaped Russian text", () => {
    const csv = requestsToCsv([requests[1]!]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Номер";"Дата";"Тема"');
    expect(csv).toContain('"000003"');
    expect(csv).toContain('"ООО «Бета»"');
    expect(csv).toContain('"Нужен акт; и сверка\nза месяц"');
    expect(csv).toContain('"Выполнено"');
  });
});
