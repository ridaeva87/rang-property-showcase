export const ADMIN_NAV_SCROLL_KEY = "rang:admin-nav-scroll-left";

export function isAdminNavigationActive(pathname: string, href: string) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const normalizedHref = href.length > 1 ? href.replace(/\/$/, "") : href;
  if (normalizedHref === "/admin") return normalizedPath === "/admin";
  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}

export function readAdminNavigationScroll(storage: Pick<Storage, "getItem">) {
  const raw = storage.getItem(ADMIN_NAV_SCROLL_KEY);
  if (raw === null || raw.trim() === "") return null;
  const stored = Number(raw);
  return Number.isFinite(stored) && stored >= 0 ? stored : null;
}

export function saveAdminNavigationScroll(storage: Pick<Storage, "setItem">, scrollLeft: number) {
  storage.setItem(ADMIN_NAV_SCROLL_KEY, String(Math.max(0, Math.round(scrollLeft))));
}
