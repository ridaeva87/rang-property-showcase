export type RequestListItem = {
  requestNumber: number | string;
  subject: string;
  description: string;
  createdAt: string | Date;
  tenant: string | null;
  premise: string | null;
  category: string;
  direction: string;
  status: string;
  statusName?: string;
  assignee: string | null;
};

export type RequestSortOrder = "newest" | "oldest";

function normalized(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("ru-RU");
}

export function filterAndSortRequests<T extends RequestListItem>(
  requests: T[],
  search: string,
  order: RequestSortOrder,
) {
  const query = normalized(search);
  return requests
    .filter((request) => {
      if (!query) return true;
      const number = String(request.requestNumber);
      const paddedNumber = number.padStart(6, "0");
      return [number, paddedNumber, request.subject, request.description, request.tenant, request.premise]
        .some((value) => normalized(value).includes(query));
    })
    .sort((left, right) => {
      const difference = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      return order === "oldest" ? difference : -difference;
    });
}

function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Prevent Excel from treating user-provided text as a formula.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function requestsToCsv(requests: RequestListItem[]) {
  const header = ["Номер", "Дата", "Тема", "Арендатор", "Помещение", "Категория", "Направление", "Статус", "Ответственный", "Описание"];
  const rows = requests.map((request) => [
    String(request.requestNumber).padStart(6, "0"),
    new Date(request.createdAt).toLocaleString("ru-RU"),
    request.subject,
    request.tenant || "Без автора",
    request.premise || "Без помещения",
    request.category,
    request.direction,
    request.statusName || request.status,
    request.assignee || "Не назначен",
    request.description,
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}
