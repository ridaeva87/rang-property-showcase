export const AUDIT_LOG_PERMISSION = "statistics.view";

const actionLabels: Record<string, string> = {
  created: "Создание",
  updated: "Изменение",
  deleted: "Удаление",
  reordered: "Изменение порядка",
  published: "Публикация",
  archived: "Снятие с публикации",
};

const entityLabels: Record<string, string> = {
  user: "Сотрудник",
  property_object: "Объект",
  premise: "Помещение",
  premise_media: "Медиа помещения",
  services: "Дополнительная услуга",
  faq: "FAQ",
  mailing: "Рассылка",
  announcement: "Объявление",
  notification: "Уведомление",
  leads: "Обращение",
  requests: "Заявка",
  waitlist: "Лист ожидания",
};

export function auditActionLabel(action: string) {
  const suffix = action.split(".").at(-1) ?? action;
  return actionLabels[suffix] ?? action;
}

export function auditEntityLabel(entityType: string) {
  return entityLabels[entityType] ?? entityType;
}
