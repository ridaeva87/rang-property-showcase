import { z } from "zod";
import { FAQ } from "@/data/rang";

export const FAQ_MANAGE_PERMISSION = "services.manage";
export const LEGACY_FAQ_CATEGORY = "Общие вопросы";

export const faqItemInputSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(3, "Укажите вопрос").max(500),
  answer: z.string().trim().min(1, "Укажите ответ").max(10000),
  category: z.string().trim().min(1, "Укажите категорию").max(160),
  publicationStatus: z.enum(["draft", "published", "archived"]),
});

export type PublicFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  legacy?: boolean;
};

const normalizedQuestion = (value: string) => value.trim().toLocaleLowerCase("ru-RU");

export function mergePublishedFaq(stored: PublicFaqItem[]): PublicFaqItem[] {
  const result = [...stored].sort((a, b) => a.displayOrder - b.displayOrder);
  const questions = new Set(result.map((item) => normalizedQuestion(item.question)));
  FAQ.forEach((item, index) => {
    if (questions.has(normalizedQuestion(item.q))) return;
    result.push({
      id: `legacy-${index + 1}`,
      question: item.q,
      answer: item.a,
      category: LEGACY_FAQ_CATEGORY,
      displayOrder: stored.length + index,
      legacy: true,
    });
  });
  return result;
}

export function moveFaqOrder(ids: string[], id: string, direction: "up" | "down") {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  const currentId = next[index]!;
  next[index] = next[target]!;
  next[target] = currentId;
  return next;
}
