import { z } from "zod";

export type MailingEmailRecipient = { id: string; email: string | null };
export type MailingEmailAttempt = {
  recipientId: string;
  status: "sent" | "error" | "skipped";
  reason: string | null;
};

export function mailingAttemptLog(attempt: MailingEmailAttempt | undefined) {
  return attempt
    ? { status: attempt.status, reason: attempt.reason }
    : { status: "skipped" as const, reason: "Email не указан или некорректен" };
}

const emailSchema = z.string().trim().email();

export function normalizeMailingEmail(email: string | null) {
  const parsed = emailSchema.safeParse(email ?? "");
  return parsed.success ? parsed.data : null;
}

export async function deliverMailingEmails(input: {
  recipients: MailingEmailRecipient[];
  canSend: (recipientId: string) => boolean;
  sendEmail: (email: string) => Promise<boolean>;
}) {
  const attempts: MailingEmailAttempt[] = [];
  let eligible = 0;

  for (const recipient of input.recipients) {
    const email = normalizeMailingEmail(recipient.email);
    if (!email) {
      attempts.push({ recipientId: recipient.id, status: "skipped", reason: "Email не указан или некорректен" });
      continue;
    }
    if (!input.canSend(recipient.id)) {
      attempts.push({ recipientId: recipient.id, status: "skipped", reason: "Нет согласия на email" });
      continue;
    }

    eligible++;
    try {
      const accepted = await input.sendEmail(email);
      attempts.push(accepted
        ? { recipientId: recipient.id, status: "sent", reason: null }
        : { recipientId: recipient.id, status: "error", reason: "Email не принят провайдером" });
    } catch {
      attempts.push({ recipientId: recipient.id, status: "error", reason: "Ошибка отправки email" });
    }
  }

  return {
    attempts,
    eligible,
    sent: attempts.filter((attempt) => attempt.status === "sent").length,
    errors: attempts.filter((attempt) => attempt.status === "error").length,
    skipped: attempts.filter((attempt) => attempt.status === "skipped").length,
  };
}

export function finalMailingStatus(result: { emailSent: number; totalSent: number }) {
  if (result.emailSent > 0) return "sent" as const;
  if (result.totalSent > 0) return "partial" as const;
  return "failed" as const;
}

export function assertMailingCanSend(status: string | undefined) {
  if (status === "sent" || status === "partial" || status === "failed") {
    throw new Error("Эта рассылка уже запускалась");
  }
}
