import { describe, expect, it, vi } from "vitest";
import { assertMailingCanSend, deliverMailingEmails, finalMailingStatus, mailingAttemptLog } from "./mailing-delivery";

describe("mailing email delivery", () => {
  it("does not attach an email warning to a successful attempt", () => {
    expect(mailingAttemptLog({ recipientId: "valid", status: "sent", reason: null }))
      .toEqual({ status: "sent", reason: null });
  });

  it("sends only to valid consented emails in a mixed segment", async () => {
    const sendEmail = vi.fn(async () => true);
    const result = await deliverMailingEmails({
      recipients: [
        { id: "valid", email: " valid@example.test " },
        { id: "missing", email: null },
        { id: "invalid", email: "not-an-email" },
        { id: "no-consent", email: "private@example.test" },
      ],
      canSend: (id) => id !== "no-consent",
      sendEmail,
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith("valid@example.test");
    expect(result).toMatchObject({ eligible: 1, sent: 1, errors: 0, skipped: 3 });
  });

  it("skips a recipient without email instead of blocking the segment", async () => {
    const sendEmail = vi.fn(async () => true);
    const result = await deliverMailingEmails({
      recipients: [{ id: "missing", email: null }], canSend: () => true, sendEmail,
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(result).toMatchObject({ eligible: 0, sent: 0, errors: 0, skipped: 1 });
  });

  it("does not call the provider or mark success when there are no eligible addresses", async () => {
    const sendEmail = vi.fn(async () => true);
    const result = await deliverMailingEmails({
      recipients: [{ id: "invalid", email: "invalid" }, { id: "no-consent", email: "user@example.test" }],
      canSend: (id) => id !== "no-consent",
      sendEmail,
    });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(result.eligible).toBe(0);
    expect(finalMailingStatus({ emailSent: result.sent, totalSent: 0 })).toBe("failed");
  });

  it("records provider rejection and provider error separately from delivery", async () => {
    const sendEmail = vi.fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error("provider unavailable"));
    const result = await deliverMailingEmails({
      recipients: [{ id: "rejected", email: "one@example.test" }, { id: "error", email: "two@example.test" }],
      canSend: () => true,
      sendEmail,
    });
    expect(result).toMatchObject({ eligible: 2, sent: 0, errors: 2, skipped: 0 });
    expect(result.attempts.map((attempt) => attempt.status)).toEqual(["error", "error"]);
    expect(result.attempts).not.toContainEqual(expect.objectContaining({ status: "delivered" }));
  });

  it("blocks a repeated launch after any completed send attempt", () => {
    expect(() => assertMailingCanSend("draft")).not.toThrow();
    expect(() => assertMailingCanSend("sent")).toThrow("уже запускалась");
    expect(() => assertMailingCanSend("partial")).toThrow("уже запускалась");
    expect(() => assertMailingCanSend("failed")).toThrow("уже запускалась");
  });
});
