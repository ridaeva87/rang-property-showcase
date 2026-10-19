const STORAGE_PREFIX = "rang:pending-request:";
const fallbackKeys = new Map<string, string>();

function requestStorage() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function getOrCreateRequestIdempotencyKey(scope: string) {
  const storageKey = `${STORAGE_PREFIX}${scope}`;
  const storage = requestStorage();
  const current = storage?.getItem(storageKey) || fallbackKeys.get(storageKey);
  if (current) return current;
  const key = crypto.randomUUID();
  try {
    storage?.setItem(storageKey, key);
  } catch {
    // The in-memory fallback still protects repeated clicks when storage is unavailable.
  }
  fallbackKeys.set(storageKey, key);
  return key;
}

export function clearRequestIdempotencyKey(scope: string, key: string) {
  const storageKey = `${STORAGE_PREFIX}${scope}`;
  const storage = requestStorage();
  if (storage?.getItem(storageKey) === key) storage.removeItem(storageKey);
  if (fallbackKeys.get(storageKey) === key) fallbackKeys.delete(storageKey);
}
