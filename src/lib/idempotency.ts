const PREFIX = "campushire.idempotency.";
const VALID_KEY = /^[A-Za-z0-9._:-]{8,80}$/;
const memoryKeys = new Map<string, string>();

type KeyStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserSessionStorage(): KeyStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getOrCreateIdempotencyKey(
  scope: string,
  storage: KeyStorage | null = browserSessionStorage(),
  createKey: () => string = () => crypto.randomUUID(),
): string {
  const storageKey = `${PREFIX}${scope}`;
  try {
    const existing = storage?.getItem(storageKey);
    if (existing && VALID_KEY.test(existing)) return existing;
  } catch {
    // Storage may be blocked. The operation can still proceed with a fresh key.
  }
  const memoryKey = memoryKeys.get(storageKey);
  if (memoryKey) return memoryKey;
  const key = createKey();
  if (!VALID_KEY.test(key)) {
    throw new Error("The generated idempotency key is invalid");
  }
  try {
    storage?.setItem(storageKey, key);
  } catch {
    // A fresh key still protects the current request when storage is unavailable.
  }
  memoryKeys.set(storageKey, key);
  return key;
}

export function clearIdempotencyKey(
  scope: string,
  storage: KeyStorage | null = browserSessionStorage(),
): void {
  try {
    storage?.removeItem(`${PREFIX}${scope}`);
  } catch {
    // Clearing best-effort browser state must not affect the confirmed operation.
  }
  memoryKeys.delete(`${PREFIX}${scope}`);
}
