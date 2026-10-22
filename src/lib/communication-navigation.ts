export type CommunicationKind = "notification" | "mailing" | "announcement";

type CommunicationAccess = { roles: readonly string[]; permissions: readonly string[] };

export function preferredCommunicationHref(user: CommunicationAccess) {
  const can = (permission: string) => user.roles.includes("admin") || user.permissions.includes(permission);
  if (can("mailings.manage")) return "/admin/mailings";
  if (can("notifications.manage")) return "/admin/notifications";
  if (can("announcements.manage")) return "/admin/announcements";
  return undefined;
}
