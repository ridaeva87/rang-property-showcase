export type CommunicationKind = "notification" | "mailing" | "announcement";

export const communicationAdminTabs = [
  { kind: "notification", href: "/admin/notifications", label: "Системные уведомления", permission: "notifications.manage" },
  { kind: "mailing", href: "/admin/mailings", label: "Информационные рассылки", permission: "mailings.manage" },
  { kind: "announcement", href: "/admin/announcements", label: "Объявления", permission: "announcements.manage" },
] as const;

type CommunicationAccess = { roles: readonly string[]; permissions: readonly string[] };

export function communicationTabsForUser(user: CommunicationAccess) {
  return communicationAdminTabs.filter((tab) => user.roles.includes("admin") || user.permissions.includes(tab.permission));
}

export function preferredCommunicationHref(user: CommunicationAccess) {
  return communicationTabsForUser(user)[0]?.href;
}
