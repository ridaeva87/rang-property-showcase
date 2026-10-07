export const ASSISTANT_KNOWLEDGE_SOURCES = {
  catalog: "Опубликованный каталог помещений PostgreSQL",
  characteristics: "Характеристики помещений PostgreSQL",
  services: "Опубликованные дополнительные услуги PostgreSQL",
  requestCategories: "Категории заявок PostgreSQL",
} as const;

// FAQ is intentionally empty until RANG marks concrete question/answer pairs as approved.
export const APPROVED_FAQ: ReadonlyArray<{ question: string; answer: string }> = [];

export const REQUEST_CATEGORY_HINTS = [
  { code: "electricity", label: "Электрика", words: ["электрик", "розет", "свет", "напряжен", "мощност"] },
  { code: "plumbing", label: "Сантехника", words: ["сантех", "вода", "труб", "кран", "раковин", "канализац"] },
  { code: "refit", label: "Переоборудование", words: ["переоборуд", "переплан", "передел"] },
  { code: "repair", label: "Ремонт", words: ["ремонт", "сломал", "поломк"] },
  { code: "access", label: "Доступ и пропуска", words: ["пропуск", "доступ", "въезд"] },
  { code: "loading", label: "Погрузка/разгрузка", words: ["погруз", "разгруз"] },
  { code: "accounting", label: "Бухгалтерия", words: ["бухгалтер", "оплат", "счет", "счёт", "акт"] },
  { code: "legal", label: "Юридические вопросы", words: ["юрист", "юрид", "договор"] },
  { code: "documents", label: "Документы", words: ["документ", "справк"] },
] as const;

export type AssistantIntent = "services" | "request_category" | "power_380" | "power_increase" | "tenant_premises" | "tenant_requests" | "search" | "faq" | "unknown";

export function normalizeAssistantText(value: string) {
  return value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/[^a-zа-я0-9+]+/gi, " ").trim();
}

export function detectAssistantIntent(question: string): AssistantIntent {
  const q = normalizeAssistantText(question);
  const words = new Set(q.split(" "));
  const asksOwn = ["мои", "мое", "моих"].some((word) => words.has(word)) || q.includes("у меня");
  if ((asksOwn || q.includes("арендую")) && q.includes("помещ")) return "tenant_premises";
  if (asksOwn && q.includes("заявк")) return "tenant_requests";
  if (/\b380\b/.test(q)) return "power_380";
  if (q.includes("увелич") && q.includes("мощност")) return "power_increase";
  if (q.includes("услуг") || q.includes("работы") || q.includes("работ ")) return "services";
  if (q.includes("категор") || q.includes("куда подать") || q.includes("какую заявку")) return "request_category";
  if (q.includes("помещ") || q.includes("склад") || q.includes("офис") || q.includes("площад") || q.includes("свобод")) return "search";
  if (q.includes("цен") || q.includes("стоим") || q.includes("услов") || q.includes("договор") || q.includes("документ") || q.includes("правил")) return "faq";
  if (REQUEST_CATEGORY_HINTS.some((item) => item.words.some((word) => q.includes(word)))) return "request_category";
  return "unknown";
}

export function isConfirmedAvailable(input: { statusCode: string | null; statusName: string | null; isAvailable: boolean | null }) {
  if (input.isAvailable) return true;
  if (input.statusCode) return ["available", "free"].includes(normalizeAssistantText(input.statusCode));
  if (input.statusName) return ["свободно", "свободен", "доступно"].includes(normalizeAssistantText(input.statusName));
  // Legacy catalog rows have no status relation; a published active rent offer is their availability source.
  return input.statusCode === null && input.statusName === null;
}

export function isConfirmedPositive(value: string | null) {
  if (!value) return false;
  const normalized = normalizeAssistantText(value);
  return ["есть", "да", "имеется", "предусмотрено"].includes(normalized) || /\b380\b/.test(normalized);
}

export function requestCategoryForQuestion(question: string) {
  const q = normalizeAssistantText(question);
  return REQUEST_CATEGORY_HINTS.find((item) => item.words.some((word) => q.includes(word)));
}

export function parseAreaCriteria(question: string) {
  const q = normalizeAssistantText(question).replace(/,/g, ".");
  const between = q.match(/(?:от\s*)?(\d+(?:\.\d+)?)\s*(?:до|[-–—])\s*(\d+(?:\.\d+)?)/);
  if (between) return { min: Number(between[1]), max: Number(between[2]) };
  const max = q.match(/до\s*(\d+(?:\.\d+)?)/);
  if (max) return { max: Number(max[1]) };
  const min = q.match(/от\s*(\d+(?:\.\d+)?)/);
  if (min) return { min: Number(min[1]) };
  const exact = q.match(/(\d+(?:\.\d+)?)\s*(?:м2|м²|кв)/);
  return exact ? { min: Number(exact[1]), max: Number(exact[1]) } : {};
}
