import { describe, expect, it, vi } from "vitest";

import { clearIdempotencyKey, getOrCreateIdempotencyKey } from "./idempotency";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("idempotency keys", () => {
  it("reuses a pending operation key until the operation is confirmed", () => {
    const storage = memoryStorage();
    const createKey = vi.fn()
      .mockReturnValueOnce("operation-key-0001")
      .mockReturnValueOnce("operation-key-0002");

    expect(getOrCreateIdempotencyKey("apply:role-1:resume-1", storage, createKey))
      .toBe("operation-key-0001");
    expect(getOrCreateIdempotencyKey("apply:role-1:resume-1", storage, createKey))
      .toBe("operation-key-0001");
    expect(createKey).toHaveBeenCalledTimes(1);

    clearIdempotencyKey("apply:role-1:resume-1", storage);
    expect(getOrCreateIdempotencyKey("apply:role-1:resume-1", storage, createKey))
      .toBe("operation-key-0002");
  });

  it("isolates keys for different operations", () => {
    const storage = memoryStorage();
    expect(getOrCreateIdempotencyKey("apply:role-2:resume-1", storage, () => "application-key-01"))
      .toBe("application-key-01");
    expect(getOrCreateIdempotencyKey("appeal:application-1", storage, () => "appeal-key-00001"))
      .toBe("appeal-key-00001");
  });
});
