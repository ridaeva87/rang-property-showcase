export type MailingDeliveryResult = {
  sent: number;
  skipped: number;
  errors: number;
  lastAttemptAt: Date | null;
};

type DeliveryRow = {
  announcementId: string | null;
  status: string;
  createdAt: Date;
};

export function aggregateMailingDeliveryResults(rows: DeliveryRow[]) {
  const results = new Map<string, MailingDeliveryResult>();
  for (const row of rows) {
    if (!row.announcementId) continue;
    const result = results.get(row.announcementId) ?? { sent: 0, skipped: 0, errors: 0, lastAttemptAt: null };
    if (row.status === "sent") result.sent += 1;
    else if (row.status === "skipped") result.skipped += 1;
    else if (row.status === "error") result.errors += 1;
    if (!result.lastAttemptAt || row.createdAt > result.lastAttemptAt) result.lastAttemptAt = row.createdAt;
    results.set(row.announcementId, result);
  }
  return results;
}

export function mailingDeliveryResultText(result: MailingDeliveryResult | null | undefined) {
  return result
    ? `Отправлено: ${result.sent} · Пропущено: ${result.skipped} · Ошибки: ${result.errors}`
    : "Нет данных о результатах отправки";
}

export function mailingViewUrl(pathname: string, id: string) {
  return `${pathname}?view=${encodeURIComponent(id)}`;
}

export function isMailingReadOnly(status: string, mode: "edit" | "view") {
  return mode === "view" || status !== "draft";
}
