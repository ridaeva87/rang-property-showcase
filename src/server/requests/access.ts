export function hasPermission(roles: string[], permissions: string[], permission: string) {
  return roles.includes("admin") || permissions.includes(permission);
}

export function requestDirectionScope(roles: string[]) {
  if (roles.includes("admin") || roles.includes("request_manager")) return null;
  if (roles.includes("accountant")) return ["accounting"];
  if (roles.includes("lawyer")) return ["legal"];
  if (roles.includes("technician")) return ["technical"];
  if (roles.includes("rental_manager")) return ["management", "access", "documents", "other"];
  return [];
}
