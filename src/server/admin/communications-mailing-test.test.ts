import { describe, expect, it, vi } from "vitest";
import { sendTestMailingWithDependencies, testMailingMessage } from "./communications.server";

const input = { subject: "Плановые работы", body: "Работы пройдут с 10:00 до 12:00." };

describe("test mailing", () => {
  it("uses the real subject and body with a test marker", () => {
    expect(testMailingMessage(input)).toEqual({
      subject: "[Тест] Плановые работы",
      text: "Тестовая отправка информационной рассылки RANG.\n\nРаботы пройдут с 10:00 до 12:00.",
    });
  });

  it("requires mailings.manage authorization", async () => {
    const sendEmail = vi.fn();
    await expect(sendTestMailingWithDependencies(input, {
      authorize: async () => { throw new Error("Доступ запрещён"); },
      loadEmployee: async () => ({ email: "employee@example.test", activatedAt: new Date() }),
      sendEmail,
    })).rejects.toThrow("Доступ запрещён");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends once and only to the authorized activated employee", async () => {
    const loadEmployee = vi.fn(async (id: string) => id === "employee-1"
      ? { email: "employee@example.test", activatedAt: new Date("2026-01-01") }
      : undefined);
    const sendEmail = vi.fn(async () => true);
    const result = await sendTestMailingWithDependencies(input, {
      authorize: async () => ({ id: "employee-1" }), loadEmployee, sendEmail,
    });
    expect(loadEmployee).toHaveBeenCalledWith("employee-1");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith({
      to: "employee@example.test",
      subject: "[Тест] Плановые работы",
      text: "Тестовая отправка информационной рассылки RANG.\n\nРаботы пройдут с 10:00 до 12:00.",
    });
    expect(result).toEqual({ ok: true, email: "employee@example.test" });
  });

  it("rejects an unconfirmed employee email without sending", async () => {
    const sendEmail = vi.fn();
    await expect(sendTestMailingWithDependencies(input, {
      authorize: async () => ({ id: "employee-1" }),
      loadEmployee: async () => ({ email: "employee@example.test", activatedAt: null }),
      sendEmail,
    })).rejects.toThrow("активированный аккаунт");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reports a provider failure without falling back to the mailing segment", async () => {
    const sendEmail = vi.fn(async () => false);
    await expect(sendTestMailingWithDependencies(input, {
      authorize: async () => ({ id: "employee-1" }),
      loadEmployee: async () => ({ email: "employee@example.test", activatedAt: new Date() }),
      sendEmail,
    })).rejects.toThrow("Почтовый сервис не принял тестовое письмо");
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
