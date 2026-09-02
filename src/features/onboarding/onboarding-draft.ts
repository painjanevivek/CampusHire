const DRAFT_VERSION = 1;
const MAX_DRAFT_AGE_MS = 12 * 60 * 60 * 1000;

export type OnboardingDraftIdentity = {
  id: string;
  institution_id: string | null;
  revision: number;
};

export type RecoveredOnboardingDraft = {
  values: Record<string, string>;
  dirtyFields: string[];
  step: number;
};

type StoredOnboardingDraft = RecoveredOnboardingDraft & {
  version: number;
  profileId: string;
  institutionId: string | null;
  baseRevision: number;
  savedAt: number;
};

function storageKey(profile: OnboardingDraftIdentity) {
  return `campushire.onboarding-draft.${profile.institution_id ?? "none"}.${profile.id}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoredDraft(value: unknown): value is StoredOnboardingDraft {
  if (!isRecord(value) || !isRecord(value.values)) return false;
  return (
    value.version === DRAFT_VERSION &&
    typeof value.profileId === "string" &&
    (typeof value.institutionId === "string" || value.institutionId === null) &&
    typeof value.baseRevision === "number" &&
    typeof value.savedAt === "number" &&
    typeof value.step === "number" &&
    Number.isInteger(value.step) &&
    value.step >= 0 &&
    value.step <= 5 &&
    Array.isArray(value.dirtyFields) &&
    value.dirtyFields.every((field) => typeof field === "string") &&
    Object.values(value.values).every((field) => typeof field === "string")
  );
}

export function readOnboardingDraft(
  storage: Storage,
  profile: OnboardingDraftIdentity,
  now = Date.now(),
): RecoveredOnboardingDraft | null {
  const key = storageKey(profile);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const stored: unknown = JSON.parse(raw);
    const valid =
      isStoredDraft(stored) &&
      stored.profileId === profile.id &&
      stored.institutionId === profile.institution_id &&
      stored.baseRevision === profile.revision &&
      stored.savedAt <= now + 60_000 &&
      now - stored.savedAt <= MAX_DRAFT_AGE_MS;
    if (!valid) {
      storage.removeItem(key);
      return null;
    }
    const dirtyFields = [...new Set(stored.dirtyFields)].filter(
      (field) => field in stored.values,
    );
    return {
      values: Object.fromEntries(
        dirtyFields.map((field) => [field, stored.values[field] as string]),
      ),
      dirtyFields,
      step: stored.step,
    };
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Hardened browser settings can make session storage unavailable.
    }
    return null;
  }
}

export function writeOnboardingDraft(
  storage: Storage,
  profile: OnboardingDraftIdentity,
  draft: RecoveredOnboardingDraft,
  now = Date.now(),
) {
  const dirtyFields = [...new Set(draft.dirtyFields)];
  const values = Object.fromEntries(
    dirtyFields
      .filter((field) => typeof draft.values[field] === "string")
      .map((field) => [field, draft.values[field]]),
  );
  const stored: StoredOnboardingDraft = {
    version: DRAFT_VERSION,
    profileId: profile.id,
    institutionId: profile.institution_id,
    baseRevision: profile.revision,
    savedAt: now,
    step: draft.step,
    dirtyFields: Object.keys(values),
    values,
  };
  try {
    storage.setItem(storageKey(profile), JSON.stringify(stored));
  } catch {
    // Server autosave remains authoritative when browser storage is unavailable.
  }
}

export function clearOnboardingDraft(
  storage: Storage,
  profile: OnboardingDraftIdentity,
) {
  try {
    storage.removeItem(storageKey(profile));
  } catch {
    // A failed cleanup must not turn a successful server save into an error.
  }
}
