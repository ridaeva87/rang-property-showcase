import { describe, expect, it } from "vitest";
import { adminDashboardAccess, buildRequestDashboard } from "./admin-dashboard";

describe("admin dashboard", () => {
  it("shows only sections allowed by employee permissions", () => {
    expect(adminDashboardAccess({ roles: [], permissions: ["requests.manage"] })).toEqual({
      statistics: false,
      requests: true,
    });
    expect(adminDashboardAccess({ roles: [], permissions: ["statistics.view"] })).toEqual({
      statistics: true,
      requests: false,
    });
    expect(adminDashboardAccess({ roles: ["admin"], permissions: [] })).toEqual({
      statistics: true,
      requests: true,
    });
  });

  it("builds counters and keeps only five newest accessible requests", () => {
    const requests = Array.from({ length: 6 }, (_, index) => ({
      id: String(index),
      requestNumber: index + 1,
      subject: `Заявка ${index + 1}`,
      createdAt: new Date(2026, 0, index + 1),
      status: index === 0 ? "closed_success" : "new",
      statusName: index === 0 ? "Закрыта успешно" : "Новая",
      assignee: null,
    }));
    const result = buildRequestDashboard(requests, [
      { code: "new", isClosed: false },
      { code: "closed_success", isClosed: true },
    ]);

    expect(result).toMatchObject({ total: 6, open: 5, closed: 1 });
    expect(result.latest.map((request) => request.requestNumber)).toEqual([6, 5, 4, 3, 2]);
  });
});
