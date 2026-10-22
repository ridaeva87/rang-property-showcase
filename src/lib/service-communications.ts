export const serviceCommunicationCategories = [
  "Плановые работы",
  "Электроснабжение",
  "Водоснабжение",
  "Технические работы",
  "Режим работы",
  "Безопасность",
  "Движение по территории",
] as const;

type ServiceCommunicationBasis = {
  category?: string | undefined;
  audience: { scope: "all" | "tenant" | "group" | "object" | "type" };
  systemLinkedRecipient?: boolean | undefined;
};

export function isServiceCommunicationCategory(category?: string) {
  return serviceCommunicationCategories.some((item) => item === category);
}

export function assertServiceCommunicationBasis(input: ServiceCommunicationBasis) {
  if (input.systemLinkedRecipient || input.audience.scope === "tenant") return;
  if (isServiceCommunicationCategory(input.category)) return;
  throw new Error("Для массовой отправки выберите подтверждённую категорию служебного сообщения");
}
