import { describe, expect, it } from "vitest";
import {
  ACTIVE_REQUEST_STATUS_CODES,
  canUseRequestStatus,
  isConfigurableRequestStatus,
  requestStatusEventType,
  requestStatusTransition,
} from "./request-statuses";

describe("request status funnel", () => {
  it("contains the six agreed configurable stages", () => {
    expect(ACTIVE_REQUEST_STATUS_CODES).toEqual([
      "new",
      "in_progress",
      "waiting_customer",
      "qualified",
      "closed_won",
      "closed_lost",
    ]);
  });

  it("keeps legacy statuses outside the configurable funnel", () => {
    expect(isConfigurableRequestStatus("accepted")).toBe(false);
    expect(isConfigurableRequestStatus("completed")).toBe(false);
  });

  it("allows an archived status only when it is already assigned", () => {
    expect(canUseRequestStatus({ currentStatusId: "accepted-id", nextStatusId: "accepted-id", nextIsActive: false })).toBe(true);
    expect(canUseRequestStatus({ currentStatusId: "new-id", nextStatusId: "accepted-id", nextIsActive: false })).toBe(false);
  });

  it("records both successful and unsuccessful final stages as closing events", () => {
    expect(requestStatusEventType(true)).toBe("closed");
    expect(requestStatusEventType(false)).toBe("status_changed");
  });

  it("preserves the exact old and new status ids in history", () => {
    expect(requestStatusTransition({ fromStatusId: "req-status-accepted", toStatusId: "req-status-qualified", isClosed: false })).toEqual({
      history: { fromStatusId: "req-status-accepted", toStatusId: "req-status-qualified" },
      event: { eventType: "status_changed", fromValue: "req-status-accepted", toValue: "req-status-qualified" },
    });
  });
});
