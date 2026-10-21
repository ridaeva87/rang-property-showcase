import { describe, expect, it } from "vitest";
import {
  aggregateMailingDeliveryResults,
  isMailingReadOnly,
  mailingDeliveryResultText,
  mailingViewUrl,
} from "./mailing-results";

describe("mailing delivery results", () => {
  it("counts sent, skipped and failed attempts per mailing", () => {
    const first = new Date("2026-10-20T09:00:00Z");
    const last = new Date("2026-10-20T09:01:00Z");
    const results = aggregateMailingDeliveryResults([
      { announcementId: "mailing-1", status: "sent", createdAt: first },
      { announcementId: "mailing-1", status: "sent", createdAt: last },
      { announcementId: "mailing-1", status: "skipped", createdAt: first },
      { announcementId: "mailing-1", status: "error", createdAt: first },
      { announcementId: "mailing-2", status: "sent", createdAt: first },
      { announcementId: null, status: "sent", createdAt: first },
    ]);

    expect(results.get("mailing-1")).toEqual({ sent: 2, skipped: 1, errors: 1, lastAttemptAt: last });
    expect(results.get("mailing-2")?.sent).toBe(1);
    expect(results.size).toBe(2);
  });

  it("does not invent zero results for old mailings without delivery logs", () => {
    expect(mailingDeliveryResultText(null)).toBe("Нет данных о результатах отправки");
    expect(mailingDeliveryResultText({ sent: 0, skipped: 2, errors: 1, lastAttemptAt: null }))
      .toBe("Отправлено: 0 · Пропущено: 2 · Ошибки: 1");
  });

  it("opens completed mailings only in read-only mode and keeps drafts editable", () => {
    expect(isMailingReadOnly("draft", "edit")).toBe(false);
    expect(isMailingReadOnly("draft", "view")).toBe(true);
    expect(isMailingReadOnly("sent", "edit")).toBe(true);
    expect(isMailingReadOnly("partial", "edit")).toBe(true);
    expect(isMailingReadOnly("failed", "edit")).toBe(true);
    expect(mailingViewUrl("/admin/mailings", "sent id/1")).toBe("/admin/mailings?view=sent%20id%2F1");
  });
});
