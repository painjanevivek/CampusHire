import { describe, expect, it } from "vitest";

import {
  clearOnboardingDraft,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "./onboarding-draft";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe("onboarding draft recovery", () => {
  const profile = {
    id: "profile-a",
    institution_id: "institution-a",
    revision: 4,
  };

  it("stores only changed fields and restores them for the same revision", () => {
    const storage = memoryStorage();
    writeOnboardingDraft(storage, profile, {
      values: { full_name: "Asha Patil", phone: "9999999999", department: "CSE" },
      dirtyFields: ["full_name", "phone"],
      step: 0,
    }, 1_000);

    expect(readOnboardingDraft(storage, profile, 2_000)).toEqual({
      values: { full_name: "Asha Patil", phone: "9999999999" },
      dirtyFields: ["full_name", "phone"],
      step: 0,
    });
  });

  it("rejects stale revisions instead of overwriting newer server data", () => {
    const storage = memoryStorage();
    writeOnboardingDraft(storage, profile, {
      values: { department: "CSE" },
      dirtyFields: ["department"],
      step: 0,
    }, 1_000);

    expect(readOnboardingDraft(storage, { ...profile, revision: 5 }, 2_000)).toBeNull();
  });

  it("clears a recovered draft after a successful server save", () => {
    const storage = memoryStorage();
    writeOnboardingDraft(storage, profile, {
      values: { department: "CSE" },
      dirtyFields: ["department"],
      step: 0,
    });
    clearOnboardingDraft(storage, profile);

    expect(readOnboardingDraft(storage, profile)).toBeNull();
  });
});
