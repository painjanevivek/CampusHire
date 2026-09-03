"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Cloud,
  FileCheck2,
  FilePenLine,
  FileText,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import { Alert } from "@/components/ui/feedback";
import { ApiError, apiPath, apiRequest, csrfRequest } from "@/lib/api/client";
import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
} from "@/lib/idempotency";
import type { ResumeUpload, ResumeVersion } from "@/features/resume/types";
import type {
  ApplicationDraft,
  ApplicationProfile,
  ApplicationReview,
  DisclosureAnswer,
  DisclosureQuestion,
  PlacementApplication,
  ResumeChoice,
  ResumeContent,
} from "./types";
import styles from "./application-wizard.module.css";

const stepOrder = ["resume", "profile", "disclosures", "review"] as const;
type Step = (typeof stepOrder)[number];

const stepMeta = [
  { key: "resume" as const, label: "Resume", detail: "For this role", icon: FileText },
  { key: "profile" as const, label: "Profile", detail: "Confirm details", icon: UserRound },
  {
    key: "disclosures" as const,
    label: "Disclosures",
    detail: "Optional and private",
    icon: ShieldCheck,
  },
  { key: "review" as const, label: "Review", detail: "Submit packet", icon: FileCheck2 },
];

type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";
type ResumeMode = "existing" | "tailor" | "upload";

const emptyProfileFields = {
  full_name: "",
  phone: "",
  department: "",
  academic_year: "",
  city: "",
  country_code: "",
};

function stepIndex(step: string): number {
  const found = stepOrder.indexOf(step as Step);
  return found === -1 ? 0 : found;
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function displayEducation(records: Array<Record<string, unknown>>): string {
  if (!records.length) return "No education record is available.";
  return records
    .map((item) =>
      [item.degree, item.branch, item.institution].filter(Boolean).map(String).join(" · "),
    )
    .join("; ");
}

function outcomeIsUnknown(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    ["offline", "timeout", "dependency", "server"].includes(error.kind)
  );
}

export function ApplicationWizard({ roleId }: { roleId: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [profile, setProfile] = useState<ApplicationProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeChoice[]>([]);
  const [step, setStep] = useState<Step>("resume");
  const [furthestStep, setFurthestStep] = useState(0);
  const [resumeMode, setResumeMode] = useState<ResumeMode>("existing");
  const [selectedResume, setSelectedResume] = useState("");
  const [resumeDirty, setResumeDirty] = useState(false);
  const [tailorContent, setTailorContent] = useState<ResumeContent | null>(null);
  const [tailorSource, setTailorSource] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [processingResumeId, setProcessingResumeId] = useState("");
  const [profileFields, setProfileFields] = useState(emptyProfileFields);
  const [profileDirty, setProfileDirty] = useState(false);
  const [answers, setAnswers] = useState<Record<string, DisclosureAnswer>>({});
  const [answersDirty, setAnswersDirty] = useState(false);
  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submissionUncertain, setSubmissionUncertain] = useState(false);

  const selectableResumes = useMemo(
    () =>
      resumes.filter(
        (item) => item.status === "completed" && item.scan_status === "clean",
      ),
    [resumes],
  );

  const hydrateProfile = useCallback((loaded: ApplicationProfile) => {
    setProfile(loaded);
    setProfileFields({
      full_name: loaded.full_name ?? "",
      phone: loaded.phone ?? "",
      department: loaded.department ?? "",
      academic_year: loaded.academic_year ?? "",
      city: loaded.city ?? "",
      country_code: loaded.country_code ?? "",
    });
    setProfileDirty(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [loadedDraft, loadedResumes, loadedProfile] = await Promise.all([
        csrfRequest<ApplicationDraft>(`/opportunities/${roleId}/application-draft`, {
          method: "POST",
        }),
        apiRequest<ResumeChoice[]>("/resumes", { cache: "no-store" }),
        apiRequest<ApplicationProfile>("/profile", { cache: "no-store" }),
      ]);
      setDraft(loadedDraft);
      setResumes(loadedResumes);
      hydrateProfile(loadedProfile);
      setAnswers(loadedDraft.disclosure_answers);
      const initialStep = loadedDraft.current_step === "submitted"
        ? "review"
        : (loadedDraft.current_step as Step);
      setStep(initialStep);
      setFurthestStep(stepIndex(initialStep));
      if (initialStep === "review" && !loadedDraft.submitted_application_id) {
        const loadedReview = await apiRequest<ApplicationReview>(
          `/application-drafts/${loadedDraft.id}/review`,
          { cache: "no-store" },
        );
        setReview(loadedReview);
      }
      const resumeId = loadedDraft.resume?.id ?? loadedResumes.find(
        (item) => item.status === "completed" && item.scan_status === "clean",
      )?.id ?? "";
      setSelectedResume(resumeId);
      setTailorSource(resumeId);
      if (loadedDraft.submitted_application_id) {
        router.replace(`/applications/${loadedDraft.submitted_application_id}`);
      }
    } catch {
      setMessage(
        "This application draft could not be opened. The role may be closed, or the service may be temporarily unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, [hydrateProfile, roleId, router]);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const showSaveError = useCallback((error: unknown) => {
    if (
      error instanceof ApiError &&
      (error.code.includes("revision_conflict") || error.message.includes("revision_conflict"))
    ) {
      setSaveState("conflict");
      setMessage(
        "This draft changed in another tab. Reload to use the latest saved version, then reapply your edits.",
      );
    } else {
      setSaveState("error");
      setMessage("Your latest changes were not saved. Check your connection and try again.");
    }
  }, []);

  const persistResume = useCallback(async (resumeId = selectedResume) => {
    if (!draft || !resumeId || draft.resume?.id === resumeId) return draft;
    setSaveState("saving");
    try {
      const saved = await csrfRequest<ApplicationDraft>(
        `/application-drafts/${draft.id}/resume`,
        {
          method: "PUT",
          body: JSON.stringify({
            expected_revision: draft.revision,
            resume_version_id: resumeId,
          }),
        },
      );
      setDraft(saved);
      setResumeDirty(false);
      setSaveState("saved");
      return saved;
    } catch (error) {
      showSaveError(error);
      return null;
    }
  }, [draft, selectedResume, showSaveError]);

  useEffect(() => {
    if (!resumeDirty || !selectedResume) return;
    const pending = window.setTimeout(() => void persistResume(), 750);
    return () => window.clearTimeout(pending);
  }, [persistResume, resumeDirty, selectedResume]);

  const persistProfile = useCallback(async () => {
    if (!profile || !profileDirty) return profile;
    setSaveState("saving");
    try {
      const saved = await csrfRequest<ApplicationProfile>("/profile", {
        method: "PATCH",
        body: JSON.stringify({
          expected_revision: profile.revision,
          ...profileFields,
          country_code: profileFields.country_code.toUpperCase(),
        }),
      });
      hydrateProfile(saved);
      setSaveState("saved");
      return saved;
    } catch (error) {
      showSaveError(error);
      return null;
    }
  }, [hydrateProfile, profile, profileDirty, profileFields, showSaveError]);

  useEffect(() => {
    if (!profileDirty || step !== "profile") return;
    const pending = window.setTimeout(() => void persistProfile(), 750);
    return () => window.clearTimeout(pending);
  }, [persistProfile, profileDirty, profileFields, step]);

  const persistDisclosures = useCallback(async () => {
    if (!draft || !answersDirty) return draft;
    setSaveState("saving");
    try {
      const saved = await csrfRequest<ApplicationDraft>(
        `/application-drafts/${draft.id}/disclosures`,
        {
          method: "PUT",
          body: JSON.stringify({ expected_revision: draft.revision, answers }),
        },
      );
      setDraft(saved);
      setAnswersDirty(false);
      setSaveState("saved");
      return saved;
    } catch (error) {
      showSaveError(error);
      return null;
    }
  }, [answers, answersDirty, draft, showSaveError]);

  useEffect(() => {
    if (!answersDirty || step !== "disclosures") return;
    const pending = window.setTimeout(() => void persistDisclosures(), 750);
    return () => window.clearTimeout(pending);
  }, [answers, answersDirty, persistDisclosures, step]);

  useEffect(() => {
    if (!processingResumeId) return;
    let active = true;
    const pending = window.setTimeout(async () => {
      try {
        const version = await apiRequest<ResumeVersion>(
          `/resumes/${processingResumeId}`,
          { cache: "no-store" },
        );
        if (!active) return;
        setResumes((current) => [
          version,
          ...current.filter((item) => item.id !== version.id),
        ]);
        if (version.status === "completed" && version.scan_status === "clean") {
          setProcessingResumeId("");
          setSelectedResume(version.id);
          setResumeDirty(true);
          setMessage("Your uploaded PDF passed safety checks and is ready for this application.");
        } else if (["failed", "cancelled"].includes(version.status)) {
          setProcessingResumeId("");
          setMessage("The uploaded PDF could not be prepared. Choose another PDF or resume version.");
          setSaveState("error");
        } else {
          setProcessingResumeId(version.id);
        }
      } catch {
        if (active) setProcessingResumeId((current) => current);
      }
    }, 1500);
    return () => {
      active = false;
      window.clearTimeout(pending);
    };
  }, [processingResumeId]);

  function chooseResume(id: string) {
    setSelectedResume(id);
    setResumeDirty(true);
    setSaveState("idle");
  }

  async function loadTailorEditor() {
    if (!tailorSource) return;
    setTailoring(true);
    setMessage("");
    try {
      setTailorContent(
        await apiRequest<ResumeContent>(`/resumes/${tailorSource}/editable-content`, {
          cache: "no-store",
        }),
      );
    } catch {
      setMessage(
        "That version has no reviewed editable content. Choose a generated or fully reviewed resume.",
      );
    } finally {
      setTailoring(false);
    }
  }

  async function createTailoredVersion() {
    if (!tailorContent || !tailorSource) return;
    setTailoring(true);
    setMessage("");
    try {
      const version = await csrfRequest<ResumeVersion>(
        `/resumes/${tailorSource}/tailored-versions`,
        {
          method: "POST",
          body: JSON.stringify({ role_id: roleId, content: tailorContent }),
        },
      );
      setResumes((current) => [version, ...current.filter((item) => item.id !== version.id)]);
      setSelectedResume(version.id);
      setResumeDirty(false);
      const saved = await persistResume(version.id);
      if (saved) {
        setMessage(
          `Tailored version ${version.version_number ?? ""} was created. Your source resume remains unchanged.`,
        );
        setTailorContent(null);
      }
    } catch (error) {
      showSaveError(error);
    } finally {
      setTailoring(false);
    }
  }

  async function uploadResume() {
    if (!uploadFile) return;
    if (uploadFile.type !== "application/pdf" || uploadFile.size > 5 * 1024 * 1024) {
      setSaveState("error");
      setMessage("Choose a PDF no larger than 5 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    const body = new FormData();
    body.append("file", uploadFile);
    try {
      const uploaded = await csrfRequest<ResumeUpload>("/resumes", {
        method: "POST",
        body,
      });
      const version = await apiRequest<ResumeVersion>(`/resumes/${uploaded.id}`, {
        cache: "no-store",
      });
      setResumes((current) => [version, ...current.filter((item) => item.id !== version.id)]);
      if (version.status === "completed" && version.scan_status === "clean") {
        chooseResume(version.id);
        setMessage("Your PDF is clean, completed, and selected for this application.");
      } else {
        setProcessingResumeId(version.id);
        setMessage("Your PDF is quarantined while safety checks and parsing finish.");
      }
    } catch {
      setSaveState("error");
      setMessage("The PDF could not be uploaded. No application changes were made.");
    } finally {
      setBusy(false);
    }
  }

  function updateProfileField(field: keyof typeof profileFields, value: string) {
    setProfileFields((current) => ({ ...current, [field]: value }));
    setProfileDirty(true);
    setSaveState("idle");
  }

  function setAnswer(question: DisclosureQuestion, value: DisclosureAnswer | undefined) {
    setAnswers((current) => {
      const next = { ...current };
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete next[question.id];
      } else {
        next[question.id] = value;
      }
      return next;
    });
    setAnswersDirty(true);
    setSaveState("idle");
  }

  function toggleMulti(question: DisclosureQuestion, option: string, checked: boolean) {
    const current = Array.isArray(answers[question.id])
      ? (answers[question.id] as string[])
      : [];
    const next = checked
      ? [...current.filter((item) => item !== option), option]
      : current.filter((item) => item !== option);
    setAnswer(question, next);
  }

  async function continueFromResume() {
    if (!selectedResume) {
      setMessage("Select, tailor, or upload a completed clean resume before continuing.");
      setSaveState("error");
      return;
    }
    setBusy(true);
    const saved = await persistResume();
    setBusy(false);
    if (!saved) return;
    setFurthestStep((value) => Math.max(value, 1));
    setStep("profile");
  }

  async function continueFromProfile() {
    if (
      !profile ||
      !profile.education.length ||
      Object.values(profileFields).some((value) => !value.trim())
    ) {
      setSaveState("error");
      setMessage(
        "Complete name, phone, department, academic year, city, country, and one education record.",
      );
      return;
    }
    setBusy(true);
    const savedProfile = profileDirty ? await persistProfile() : profile;
    if (!savedProfile || !draft) {
      setBusy(false);
      return;
    }
    try {
      const savedDraft = await csrfRequest<ApplicationDraft>(
        `/application-drafts/${draft.id}/profile-confirmation`,
        {
          method: "PUT",
          body: JSON.stringify({
            expected_revision: draft.revision,
            profile_revision: savedProfile.revision,
          }),
        },
      );
      setDraft(savedDraft);
      setSaveState("saved");
      setFurthestStep((value) => Math.max(value, 2));
      setStep("disclosures");
    } catch (error) {
      showSaveError(error);
    } finally {
      setBusy(false);
    }
  }

  async function continueFromDisclosures() {
    if (!draft) return;
    setBusy(true);
    let saved = draft;
    if (answersDirty || !draft.disclosure_completed) {
      const result = await persistDisclosures();
      if (!result) {
        setBusy(false);
        return;
      }
      saved = result;
    }
    try {
      const loadedReview = await apiRequest<ApplicationReview>(
        `/application-drafts/${saved.id}/review`,
        { cache: "no-store" },
      );
      setReview(loadedReview);
      setDraft(loadedReview.draft);
      setFurthestStep(3);
      setStep("review");
      setSaveState("saved");
    } catch (error) {
      showSaveError(error);
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication() {
    if (!draft || !accuracyConfirmed) return;
    const scope = `application-draft-submit:${draft.id}`;
    const idempotencyKey = getOrCreateIdempotencyKey(scope);
    setBusy(true);
    setMessage("");
    try {
      const application = await csrfRequest<PlacementApplication>(
        `/application-drafts/${draft.id}/submit`,
        {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({
            expected_revision: draft.revision,
            confirmation: "I CONFIRM THIS APPLICATION IS ACCURATE",
          }),
        },
      );
      clearIdempotencyKey(scope);
      setSubmissionUncertain(false);
      router.push(`/applications/${application.id}`);
    } catch (error) {
      if (outcomeIsUnknown(error)) {
        setSubmissionUncertain(true);
        setMessage(
          "CampusHire could not confirm the outcome. Retry safely with the same request, or check Applications before leaving.",
        );
      } else {
        clearIdempotencyKey(scope);
        showSaveError(error);
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main id="main-content" className={styles.state} aria-busy="true">
        <LoaderCircle aria-hidden="true" />
        <h1>Preparing your application</h1>
        <p>Resuming the latest server-saved draft…</p>
      </main>
    );
  }

  if (!draft || !profile) {
    return (
      <main id="main-content" className={styles.state}>
        <CircleAlert aria-hidden="true" />
        <h1>Application unavailable</h1>
        <Alert tone="error">{message}</Alert>
        <button type="button" className={styles.primaryButton} onClick={() => void load()}>
          Retry
        </button>
        <Link href={`/opportunities/${roleId}`}>Return to role</Link>
      </main>
    );
  }

  const activeIndex = stepIndex(step);
  const lastSaved = new Date(draft.last_saved_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <Link href={`/opportunities/${roleId}`} className={styles.backLink}>
          <ChevronLeft aria-hidden="true" /> Back to role
        </Link>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.eyebrow}>Application packet</p>
            <h1>{draft.role_title}</h1>
            <span>{draft.company_name} · Apply by {new Date(draft.deadline_at).toLocaleDateString()}</span>
          </div>
          <div className={styles.saveStatus} aria-live="polite" aria-atomic="true">
            {saveState === "saving" ? <LoaderCircle aria-hidden="true" /> : <Cloud aria-hidden="true" />}
            <span>
              {saveState === "saving"
                ? "Saving…"
                : saveState === "conflict"
                  ? "Reload required"
                  : `Saved at ${lastSaved}`}
            </span>
          </div>
        </div>
      </header>

      <nav className={styles.stepper} aria-label="Application steps">
        <ol>
          {stepMeta.map((item, index) => {
            const Icon = item.icon;
            const complete = index < activeIndex || index < furthestStep;
            return (
              <li key={item.key} className={index === activeIndex ? styles.activeStep : complete ? styles.completeStep : ""}>
                <button
                  type="button"
                  aria-current={index === activeIndex ? "step" : undefined}
                  disabled={index > furthestStep}
                  onClick={() => setStep(item.key)}
                >
                  <span className={styles.stepIcon}>
                    {complete ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}
                  </span>
                  <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {message ? (
        <Alert tone={saveState === "error" || saveState === "conflict" ? "error" : "success"}>
          {message}{" "}
          {saveState === "conflict" ? (
            <button type="button" className={styles.inlineButton} onClick={() => void load()}>
              Reload latest draft
            </button>
          ) : null}
        </Alert>
      ) : null}

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-labelledby={`${step}-title`}>
          {step === "resume" ? (
            <>
              <div className={styles.sectionHeading}>
                <p>Step 1 of 4</p>
                <h2 id="resume-title">Choose the resume for this role</h2>
                <span>Your choice is saved only to this application draft.</span>
              </div>
              <div className={styles.modeGrid} role="radiogroup" aria-label="Resume method">
                {([
                  ["existing", FileCheck2, "Use existing", "Choose a completed, clean PDF."],
                  ["tailor", FilePenLine, "Tailor a copy", "Edit reviewed content without changing the source."],
                  ["upload", Upload, "Upload PDF", "Run a new PDF through the secure pipeline."],
                ] as const).map(([value, Icon, title, detail]) => (
                  <label key={value} className={resumeMode === value ? styles.selectedMode : styles.modeCard}>
                    <input
                      type="radio"
                      name="resume-mode"
                      value={value}
                      checked={resumeMode === value}
                      onChange={() => setResumeMode(value)}
                    />
                    <Icon aria-hidden="true" />
                    <strong>{title}</strong>
                    <span>{detail}</span>
                  </label>
                ))}
              </div>

              {resumeMode === "existing" ? (
                <fieldset className={styles.resumeList}>
                  <legend>Ready resume versions</legend>
                  {selectableResumes.length ? selectableResumes.map((resume) => (
                    <label key={resume.id} className={selectedResume === resume.id ? styles.selectedResume : ""}>
                      <input
                        type="radio"
                        name="resume-version"
                        value={resume.id}
                        checked={selectedResume === resume.id}
                        onChange={() => chooseResume(resume.id)}
                      />
                      <FileText aria-hidden="true" />
                      <span><strong>{resume.original_name}</strong><small>Version {resume.version_number ?? "—"} · Clean and completed</small></span>
                      {selectedResume === resume.id ? <CheckCircle2 aria-label="Selected" /> : null}
                    </label>
                  )) : <Alert tone="warning">No completed clean resume is available yet.</Alert>}
                </fieldset>
              ) : null}

              {resumeMode === "tailor" ? (
                <div className={styles.tailorPanel}>
                  <label htmlFor="tailor-source">Source resume</label>
                  <select id="tailor-source" value={tailorSource} onChange={(event) => { setTailorSource(event.target.value); setTailorContent(null); }}>
                    <option value="">Choose a version</option>
                    {selectableResumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.original_name} · v{resume.version_number ?? "—"}</option>)}
                  </select>
                  {!tailorContent ? (
                    <button type="button" className={styles.secondaryButton} onClick={() => void loadTailorEditor()} disabled={!tailorSource || tailoring}>
                      <FilePenLine aria-hidden="true" /> {tailoring ? "Opening editor…" : "Open embedded editor"}
                    </button>
                  ) : (
                    <div className={styles.editor}>
                      <div className={styles.formGrid}>
                        <label>Full name<input value={tailorContent.full_name} onChange={(event) => setTailorContent({ ...tailorContent, full_name: event.target.value })} /></label>
                        <label>Email<input type="email" value={tailorContent.email} onChange={(event) => setTailorContent({ ...tailorContent, email: event.target.value })} /></label>
                      </div>
                      <label>Summary<textarea value={tailorContent.summary} maxLength={900} onChange={(event) => setTailorContent({ ...tailorContent, summary: event.target.value })} /></label>
                      <label>Skills <small>One per line</small><textarea value={tailorContent.skills.join("\n")} onChange={(event) => setTailorContent({ ...tailorContent, skills: lines(event.target.value) })} /></label>
                      <label>Projects <small>One per line</small><textarea value={tailorContent.projects.join("\n")} onChange={(event) => setTailorContent({ ...tailorContent, projects: lines(event.target.value) })} /></label>
                      <label>Education <small>One per line</small><textarea value={tailorContent.education.join("\n")} onChange={(event) => setTailorContent({ ...tailorContent, education: lines(event.target.value) })} /></label>
                      <button type="button" className={styles.primaryButton} onClick={() => void createTailoredVersion()} disabled={tailoring}>
                        {tailoring ? "Generating PDF…" : "Create immutable tailored PDF"}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {resumeMode === "upload" ? (
                <div className={styles.uploadPanel}>
                  <Upload aria-hidden="true" />
                  <div><strong>Upload a new PDF</strong><span>PDF only · 5 MB maximum · malware scan and isolated parsing</span></div>
                  <input type="file" accept="application/pdf,.pdf" aria-label="Choose resume PDF" onChange={(event: ChangeEvent<HTMLInputElement>) => setUploadFile(event.target.files?.[0] ?? null)} />
                  <button type="button" className={styles.secondaryButton} onClick={() => void uploadResume()} disabled={!uploadFile || busy || Boolean(processingResumeId)}>
                    {processingResumeId ? "Safety checks running…" : "Upload and process"}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {step === "profile" ? (
            <>
              <div className={styles.sectionHeading}>
                <p>Step 2 of 4</p>
                <h2 id="profile-title">Confirm your profile details</h2>
                <span>Only these fields enter this role’s immutable application snapshot.</span>
              </div>
              <div className={styles.formGrid}>
                {(Object.keys(profileFields) as Array<keyof typeof profileFields>).map((field) => (
                  <label key={field}>
                    {field.replaceAll("_", " ")}
                    <input
                      value={profileFields[field]}
                      maxLength={field === "country_code" ? 2 : undefined}
                      onChange={(event) => updateProfileField(field, event.target.value)}
                      onBlur={() => void persistProfile()}
                    />
                  </label>
                ))}
                <label>Account email<input value={profile.account_email ?? ""} readOnly aria-readonly="true" /></label>
              </div>
              <div className={styles.readOnlyFact}>
                <strong>Education</strong>
                <p>{displayEducation(profile.education)}</p>
                <Link href="/onboarding">Edit education in your profile</Link>
              </div>
              <Alert tone="info">Street address is not requested or shared in the application packet.</Alert>
            </>
          ) : null}

          {step === "disclosures" ? (
            <>
              <div className={styles.sectionHeading}>
                <p>Step 3 of 4</p>
                <h2 id="disclosures-title">Voluntary disclosures</h2>
                <span>Every question can be skipped. Answers are encrypted and compliance-only.</span>
              </div>
              {draft.form ? (
                <div className={styles.formNotice}>
                  <LockKeyhole aria-hidden="true" />
                  <div><strong>{draft.form.purpose}</strong><p>Visible only to {draft.form.compliance_owner}. Retained for {draft.form.retention_days} days after submission.</p></div>
                </div>
              ) : (
                <Alert tone="info">This role has no published disclosure form. Continue without providing any disclosures.</Alert>
              )}
              <div className={styles.questions}>
                {draft.form?.questions.map((question, index) => (
                  <fieldset key={question.id}>
                    <legend>{index + 1}. {question.prompt} <span>Optional</span></legend>
                    {question.type === "multi_select" ? (
                      <>
                        {question.options.map((option) => (
                          <label key={option}><input type="checkbox" checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option)} onChange={(event) => toggleMulti(question, option, event.target.checked)} />{option}</label>
                        ))}
                        <label><input type="checkbox" checked={answers[question.id] === "prefer_not_to_answer"} onChange={(event) => setAnswer(question, event.target.checked ? "prefer_not_to_answer" : undefined)} />Prefer not to answer</label>
                      </>
                    ) : (
                      <select aria-label={question.prompt} value={typeof answers[question.id] === "string" ? String(answers[question.id]) : typeof answers[question.id] === "boolean" ? String(answers[question.id]) : ""} onChange={(event) => {
                        const value = event.target.value;
                        setAnswer(question, value === "" ? undefined : value === "true" ? true : value === "false" ? false : value);
                      }}>
                        <option value="">Skip this question</option>
                        {question.type === "boolean" ? <><option value="true">Yes</option><option value="false">No</option></> : question.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        <option value="prefer_not_to_answer">Prefer not to answer</option>
                      </select>
                    )}
                  </fieldset>
                ))}
              </div>
            </>
          ) : null}

          {step === "review" ? (
            <>
              <div className={styles.sectionHeading}>
                <p>Step 4 of 4</p>
                <h2 id="review-title">Review the exact packet</h2>
                <span>Nothing changes after submission; future profile edits apply only to future roles.</span>
              </div>
              {review ? (
                <div className={styles.reviewStack}>
                  <article><FileText aria-hidden="true" /><div><span>Resume</span><strong>{review.draft.resume?.original_name}</strong><a href={apiPath(`/resumes/${review.draft.resume?.id}/download`)}>Preview PDF</a></div></article>
                  <article><UserRound aria-hidden="true" /><div><span>Profile snapshot</span><strong>{String(review.profile_snapshot.full_name ?? "")}</strong><p>{String(review.profile_snapshot.email ?? "")} · {String(review.profile_snapshot.phone ?? "")}</p><p>{String(review.profile_snapshot.department ?? "")} · {String(review.profile_snapshot.academic_year ?? "")} · {String(review.profile_snapshot.city ?? "")}, {String(review.profile_snapshot.country_code ?? "")}</p></div></article>
                  <article><LockKeyhole aria-hidden="true" /><div><span>Disclosure collection</span><strong>{draft.form ? (Object.keys(answers).length ? "Responses collected" : "No responses provided") : "Not configured"}</strong><p>Hiring reviewers see collection status only, never answers.</p></div></article>
                  <div className={styles.immutableNotice}><ShieldCheck aria-hidden="true" /><p>{review.immutable_notice}</p></div>
                  <label className={styles.confirmation}><input type="checkbox" checked={accuracyConfirmed} onChange={(event) => setAccuracyConfirmed(event.target.checked)} /><span><strong>I confirm this application is accurate.</strong><small>I understand that the submitted packet is immutable.</small></span></label>
                  <button type="button" className={styles.submitButton} disabled={!accuracyConfirmed || busy} onClick={() => void submitApplication()}>
                    {busy ? "Submitting…" : submissionUncertain ? "Retry submission safely" : "Submit application"}
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              ) : <Alert tone="warning">The exact review packet is not loaded. Return to disclosures and continue again.</Alert>}
            </>
          ) : null}
        </section>

        <aside className={styles.summary} aria-label="Application summary">
          <p>Application summary</p>
          <h2>{draft.role_title}</h2>
          <dl>
            <div><dt>Company</dt><dd>{draft.company_name}</dd></div>
            <div><dt>Resume</dt><dd>{draft.resume?.original_name ?? "Not selected"}</dd></div>
            <div><dt>Profile revision</dt><dd>{draft.profile_revision ? `Revision ${draft.profile_revision}` : "Not confirmed"}</dd></div>
            <div><dt>Disclosure form</dt><dd>{draft.form ? `Version ${draft.form.version}` : "Not configured"}</dd></div>
          </dl>
          <div className={styles.privateNote}><LockKeyhole aria-hidden="true" /><p>Disclosure answers remain encrypted and are never used for eligibility, matching, ranking, or hiring recommendations.</p></div>
        </aside>
      </div>

      <footer className={styles.footerActions}>
        <button type="button" className={styles.secondaryButton} disabled={activeIndex === 0 || busy} onClick={() => setStep(stepOrder[activeIndex - 1])}>
          <ChevronLeft aria-hidden="true" /> Back
        </button>
        {step === "resume" ? <button type="button" className={styles.primaryButton} disabled={busy || !selectedResume} onClick={() => void continueFromResume()}>Continue <ChevronRight aria-hidden="true" /></button> : null}
        {step === "profile" ? <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => void continueFromProfile()}>Confirm and continue <ChevronRight aria-hidden="true" /></button> : null}
        {step === "disclosures" ? <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => void continueFromDisclosures()}>Continue to review <ChevronRight aria-hidden="true" /></button> : null}
      </footer>
    </main>
  );
}
