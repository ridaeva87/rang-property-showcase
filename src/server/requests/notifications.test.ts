import { describe, expect, it, vi } from "vitest";
import { requestNotificationEmail } from "@/server/portal/email.server";
import {
  canReceiveRequestNotification,
  deliverRequestNotification,
  notifyCreatedRequest,
  type RequestNotificationRecipient,
} from "./notifications.server";

function recipient(overrides: Partial<RequestNotificationRecipient> = {}): RequestNotificationRecipient {
  return {
    employeeId: "employee-1",
    userId: "user-1",
    email: "employee@example.test",
    isActive: true,
    roles: ["rental_manager"],
    permissions: ["requests.manage"],
    ...overrides,
  };
}

describe("request notification access", () => {
  it("allows only active employees with permission and direction access", () => {
    expect(canReceiveRequestNotification(recipient(), "management")).toBe(true);
    expect(canReceiveRequestNotification(recipient({ isActive: false }), "management")).toBe(false);
    expect(canReceiveRequestNotification(recipient({ permissions: [] }), "management")).toBe(false);
    expect(canReceiveRequestNotification(recipient(), "accounting")).toBe(false);
    expect(canReceiveRequestNotification(recipient({ roles: ["admin"], permissions: [] }), "legal")).toBe(true);
  });
});

describe("request notification delivery", () => {
  it("deduplicates recipients and sends no request details or personal data", async () => {
    const send = vi.fn(async () => true);
    const duplicate = recipient({ employeeId: "employee-2", userId: "user-2", email: "EMPLOYEE@example.test" });
    await expect(
      deliverRequestNotification([recipient(), duplicate], { requestNumber: 15, eventTitle: "Создана новая заявка" }, send),
    ).resolves.toEqual({ sent: 1, failed: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({
      to: "employee@example.test",
      requestNumber: 15,
      eventTitle: "Создана новая заявка",
    });
    const email = requestNotificationEmail({ requestNumber: 15, eventTitle: "Создана новая заявка" });
    expect(email.text).toContain("№000015");
    expect(email.text).toContain("/admin/requests");
    expect(email.text).not.toContain("employee@example.test");
  });

  it("does not fail the business operation when the mail provider fails", async () => {
    const send = vi.fn(async () => {
      throw new Error("mail unavailable");
    });
    await expect(
      deliverRequestNotification([recipient()], { requestNumber: 16, eventTitle: "Изменён статус заявки" }, send),
    ).resolves.toEqual({ sent: 0, failed: 1 });
  });

  it("notifies only the first successful creation for an idempotent request", async () => {
    const notify = vi.fn(async () => ({ sent: 1, failed: 0 }));
    await expect(notifyCreatedRequest({ id: "request-1", created: true }, notify)).resolves.toBe(true);
    await expect(notifyCreatedRequest({ id: "request-1", created: false }, notify)).resolves.toBe(false);
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
