"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  Edit3,
  FileDown,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { ApiError, apiPath, apiRequest, csrfRequest } from "@/lib/api/client";
import type { StudentOnboardingResponse } from "@/lib/api/generated/types.gen";
import type { ResumeSuggestion, ResumeVersion } from "./types";
import styles from "./resume-builder.module.css";

type FieldDecision = {
  action: "pending" | "accept" | "edit" | "reject";
  value: string | string[];
};

type ResumeDraft = {
  fullName: string;
  email: string;
  phone: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  summary: string;
  skills: string;
  projects: string;
  education: string;
  experience: string;
  credentials: string;
  research: string;
  publications: string;
  achievements: string;
  positions: string;
  extracurricular: string;
};

type ResumeProfile = {
  full_name: string | null;
  account_email: string | null;
  phone: string | null;
  education: Array<{
    degree?: string;
    branch?: string;
    institution?: string;
    start_year?: number;
    graduation_year?: number;
    score?: number;
    score_scale?: string;
  }>;
  skills: Array<{ name?: string }>;
  external_links: Record<string, string>;
};

type ResumeReadiness = {
  ready: boolean;
  blocking: string[];
  warnings: string[];
  informational: string[];
};

const emptyDraft: ResumeDraft = {
  fullName: "",
  email: "",
  phone: "",
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
  summary: "",
  skills: "",
  projects: "",
  education: "",
  experience: "",
  credentials: "",
  research: "",
  publications: "",
  achievements: "",
  positions: "",
  extracurricular: "",
};

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

type ProfileRecord = Record<string, unknown>;

function records(value: unknown): ProfileRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is ProfileRecord => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    : [];
}

function text(record: ProfileRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function textList(value: unknown): string {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean).join(", ") : "";
}

function profileDraft(profile: ResumeProfile, onboarding: StudentOnboardingResponse | null): ResumeDraft {
  const education = profile.education.length ? profile.education : records(onboarding?.education);
  const skills = profile.skills.length ? profile.skills.map((item) => item.name ?? "") : records(onboarding?.skills).map((item) => text(item, "name"));
  const experience = records(onboarding?.experience).map((item) => {
    const role = [text(item, "title"), text(item, "organization")].filter(Boolean).join(" · ");
    const dates = [text(item, "start_date"), text(item, "end_date") || (item.is_current ? "Present" : "")].filter(Boolean).join("–");
    const responsibilities = Array.isArray(item.responsibilities) ? item.responsibilities.map(String).join("; ") : text(item, "responsibilities");
    return [role, dates, responsibilities].filter(Boolean).join(" — ");
  }).filter(Boolean);
  const projects = records(onboarding?.projects).map((item) => {
    const technologies = Array.isArray(item.technologies) ? item.technologies.map(String).filter(Boolean).join(", ") : "";
    return [text(item, "title"), text(item, "description"), technologies ? `Technologies: ${technologies}` : "", text(item, "project_url")].filter(Boolean).join(" — ");
  }).filter(Boolean);
  const credentials = records(onboarding?.certifications).map((item) =>
    [text(item, "name"), text(item, "issuer"), text(item, "issued_on")].filter(Boolean).join(" — "),
  ).filter(Boolean);
  const identity = onboarding?.identity ?? {};
  const preferences = onboarding?.career_preferences ?? {};
  const summary = [
    textList(preferences.target_roles) ? `Target roles: ${textList(preferences.target_roles)}` : "",
    textList(preferences.industries) ? `Industries: ${textList(preferences.industries)}` : "",
    textList(preferences.locations) ? `Preferred locations: ${textList(preferences.locations)}` : "",
    textList(preferences.job_types) ? `Work types: ${textList(preferences.job_types)}` : "",
    textList(preferences.work_modes) ? `Work modes: ${textList(preferences.work_modes)}` : "",
  ].filter(Boolean).join("\n");

  return {
    ...emptyDraft,
    fullName: profile.full_name ?? text(identity, "full_name"),
    email: profile.account_email ?? "",
    phone: profile.phone ?? "",
    githubUrl: profile.external_links.github ?? "",
    linkedinUrl: profile.external_links.linkedin ?? "",
    portfolioUrl: profile.external_links.portfolio ?? "",
    summary,
    skills: skills.filter(Boolean).join("\n"),
    projects: projects.join("\n"),
    education: education.map((item) => {
      const record = item as ProfileRecord;
      const qualification = [text(record, "degree"), text(record, "branch")].filter(Boolean).join(" ");
      const dates = [text(record, "start_year"), text(record, "graduation_year")].filter(Boolean).join("–");
      const score = [text(record, "score"), text(record, "score_scale")].filter(Boolean).join(" ");
      return [qualification, text(record, "institution"), dates, score].filter(Boolean).join(" — ");
    }).filter(Boolean).join("\n"),
    experience: experience.join("\n"),
    credentials: credentials.join("\n"),
  };
}

function displayValue(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : String(value ?? "");
}

function initialDecisions(version: ResumeVersion): Record<string, FieldDecision> {
  const proposed = version.extracted_data.proposed ?? {};
  const existing = version.extracted_data.decisions ?? {};
  return Object.fromEntries(Object.entries(proposed).map(([field, value]) => {
    const decision = existing[field];
    return [field, {
      action: decision?.action ?? "pending",
      value: (decision?.value as string | string[] | undefined) ?? value,
    }];
  }));
}

function resolvedValue(version: ResumeVersion, field: string): unknown {
  const decision = version.extracted_data.decisions?.[field];
  if (decision?.action === "reject") return undefined;
  return decision?.value ?? version.extracted_data.proposed?.[field];
}

function generationFailureMessage(code: string | null | undefined): string {
  if (code === "resume_latex_compiler_unavailable") return "The local PDF compiler is unavailable. Check the Resume Generator setup and retry.";
  if (code === "resume_latex_timeout") return "Resume generation took too long. Your saved profile was not changed; you can retry.";
  if (code === "resume_latex_dependency_missing") return "A required local LaTeX package is missing. Install the template dependencies, then retry generation.";
  if (code === "resume_latex_compile_failed" || code === "resume_template_unavailable") return "The resume could not be rendered. Your profile and accepted details are unchanged; you can retry after the renderer is available.";
  if (code === "resume_pdf_invalid" || code === "resume_pdf_too_large") return "The generated PDF did not pass validation. Your profile was not changed.";
  if (code === "resume_pdf_too_many_pages") return "This resume is longer than the supported page limit. Shorten optional sections and generate a new version.";
  return "Resume generation failed safely. Your profile and accepted details are unchanged.";
}

function resumePayload(draft: ResumeDraft) {
  return {
    full_name: draft.fullName.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim() || null,
    github_url: draft.githubUrl.trim() || null,
    linkedin_url: draft.linkedinUrl.trim() || null,
    portfolio_url: draft.portfolioUrl.trim() || null,
    summary: draft.summary.trim(),
    skills: lines(draft.skills),
    projects: lines(draft.projects),
    education: lines(draft.education),
    experience: lines(draft.experience),
    credentials: [],
    research: lines(draft.research),
    publications: lines(draft.publications),
    certifications: lines(draft.credentials),
    achievements: lines(draft.achievements),
    positions: lines(draft.positions),
    extracurricular: lines(draft.extracurricular),
  };
}

export function ResumeBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedVersion = searchParams.get("version");
  const manualMode = searchParams.get("mode") === "manual";
  const onboardingStep = searchParams.get("onboarding") === "1";
  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [decisions, setDecisions] = useState<Record<string, FieldDecision>>({});
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null);
  const [suggestionCopy, setSuggestionCopy] = useState<Record<string, string>>({});
  const [suggestionDecisions, setSuggestionDecisions] = useState<Record<string, { action: "accept" | "edit" | "reject"; edited_text?: string }>>({});
  const [draft, setDraft] = useState<ResumeDraft>(emptyDraft);
  const [generated, setGenerated] = useState<ResumeVersion | null>(null);
  const [serverReadiness, setServerReadiness] = useState<ResumeReadiness | null>(null);
  const [state, setState] = useState<"loading" | "idle" | "saving" | "processing" | "error">("loading");
  const [message, setMessage] = useState("");
  const generationId = generated?.id;
  const generationStatus = generated?.status;

  const selectVersion = useCallback((selected: ResumeVersion) => {
    setVersion(selected);
    setDecisions(initialDecisions(selected));
    setSuggestionCopy(Object.fromEntries(selected.suggestions.map((item) => [item.id, item.proposed_text])));
    setSuggestionDecisions({});
    const values = (field: string) => {
      const value = resolvedValue(selected, field);
      return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
    };
    const links = values("links");
    setDraft({
      ...emptyDraft,
      fullName: displayValue(resolvedValue(selected, "full_name")),
      email: displayValue(resolvedValue(selected, "email")),
      phone: displayValue(resolvedValue(selected, "phone")),
      githubUrl: links.find((value) => value.includes("github.com")) ?? "",
      linkedinUrl: links.find((value) => value.includes("linkedin.com")) ?? "",
      portfolioUrl: links.find((value) => !value.includes("github.com") && !value.includes("linkedin.com")) ?? "",
      skills: values("skills").join("\n"),
      projects: values("projects").join("\n"),
      education: values("education").join("\n"),
      experience: values("experience").join("\n"),
      credentials: values("credentials").join("\n"),
      research: values("research").join("\n"),
      publications: values("publications").join("\n"),
      achievements: values("achievements").join("\n"),
    });
  }, []);

  const reconcileConflict = useCallback(async (selected: ResumeVersion) => {
    const latest = await apiRequest<ResumeVersion>(`/resumes/${selected.id}`, { cache: "no-store" });
    selectVersion(latest);
    setState("idle");
    setMessage("A newer review was saved in another tab. The latest decisions are now loaded; check them before continuing.");
  }, [selectVersion]);

  useEffect(() => {
    let active = true;
    async function load() {
        setState("loading");
      try {
        if (manualMode) {
          const profile = await apiRequest<ResumeProfile>("/profile", { cache: "no-store" });
          const onboarding = await apiRequest<StudentOnboardingResponse>("/onboarding", { cache: "no-store" }).catch(() => null);
          if (active) {
            setVersion(null);
            setDraft(profileDraft(profile, onboarding));
            setState("idle");
          }
          return;
        }
        const selected = requestedVersion
          ? await apiRequest<ResumeVersion>(`/resumes/${requestedVersion}`, { cache: "no-store" })
          : (await apiRequest<ResumeVersion[]>("/resumes", { cache: "no-store" }))
            .find((item) => item.status === "review_required");
        if (active && selected) selectVersion(selected);
        if (active) setState("idle");
      } catch {
        if (active) {
          setState("error");
          setMessage(manualMode
            ? "Your profile could not be prefilled. You can still enter the resume details manually."
            : "The selected resume version could not be loaded.");
        }
      }
    }
    void load();
    return () => { active = false; };
  }, [manualMode, requestedVersion, selectVersion]);

  useEffect(() => {
    if (!generationId || !generationStatus || ["completed", "failed", "cancelled"].includes(generationStatus)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      try {
        const current = await apiRequest<ResumeVersion>(`/resumes/${generationId}`, { cache: "no-store" });
        if (!active) return;
        setGenerated(current);
        if (current.status === "completed") {
          setState("idle");
          setMessage(`Resume v${current.version_number ?? ""} is ready to download.`);
          return;
        }
        if (["failed", "cancelled"].includes(current.status)) {
          setState("error");
          setMessage(generationFailureMessage(current.safe_error_code));
          return;
        }
        setState("processing");
        setMessage("Generating your resume in the local document worker…");
        timer = setTimeout(() => void poll(), 1500);
      } catch {
        if (!active) return;
        setState("processing");
        setMessage("Resume generation is still running. We’ll check its status again shortly.");
        timer = setTimeout(() => void poll(), 4000);
      }
    }
    timer = setTimeout(() => void poll(), 1200);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [generationId, generationStatus]);

  const proposedEntries = useMemo(
    () => Object.entries(version?.extracted_data.proposed ?? {}),
    [version],
  );
  const unresolvedFields = Object.values(decisions).filter((item) => item.action === "pending").length;
  const readiness = useMemo<ResumeReadiness>(() => {
    const blocking = [
      ...(draft.fullName.trim().length < 2 ? ["Add your full name."] : []),
      ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) ? ["Add a valid email address."] : []),
      ...(lines(draft.education).length === 0 ? ["Add at least one education entry."] : []),
    ];
    const warnings = [
      ...(lines(draft.projects).length ? [] : ["Add a project if you have one."]),
      ...(lines(draft.experience).length ? [] : ["Add experience if you have it."]),
      ...(lines(draft.skills).length ? [] : ["Add relevant skills."]),
      ...(draft.githubUrl.trim() ? [] : ["Add GitHub if you have a profile to share."]),
      ...(draft.linkedinUrl.trim() ? [] : ["Add LinkedIn if you have a profile to share."]),
      ...(draft.portfolioUrl.trim() ? [] : ["Add a portfolio link if you have one."]),
    ];
    return {
      ready: blocking.length === 0,
      blocking,
      warnings,
      informational: ["Research, publications, and certifications are optional."],
    };
  }, [draft]);

  async function saveExtraction() {
    if (!version) return;
    if (unresolvedFields > 0) {
      setMessage(`Review ${unresolvedFields} remaining resume detail${unresolvedFields === 1 ? "" : "s"}.`);
      return;
    }
    setState("saving");
    try {
      const updated = await csrfRequest<ResumeVersion>(`/resumes/${version.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          expected_revision: version.review_revision,
          decisions: Object.entries(decisions).map(([field_path, decision]) => ({
            field_path,
            action: decision.action,
            ...(decision.action === "edit" ? { value: decision.value } : {}),
          })),
        }),
      });
      selectVersion(updated);
      setMessage("Extraction decisions saved. Only accepted or edited fields can enter the reviewed version.");
      setState("idle");
    } catch (error) {
      if (error instanceof ApiError && error.code === "resume_review_revision_conflict") {
        try { await reconcileConflict(version); } catch { setState("error"); setMessage("A newer review exists, but it could not be loaded. Refresh before editing again."); }
        return;
      }
      setState("error");
      setMessage("Those extraction decisions could not be saved. No proposed field was accepted.");
    }
  }

  function stageSuggestion(suggestion: ResumeSuggestion, action: "accept" | "edit" | "reject") {
    setSuggestionDecisions((current) => ({
      ...current,
      [suggestion.id]: {
        action,
        ...(action === "edit" ? { edited_text: suggestionCopy[suggestion.id] } : {}),
      },
    }));
    setEditingSuggestion(null);
    setMessage("Suggestion decision staged. Save all decisions when you are ready, or undo it first.");
  }

  async function saveSuggestions() {
    if (!version) return;
    const staged = Object.entries(suggestionDecisions);
    if (!staged.length) return;
    setState("saving");
    try {
      const updated = await csrfRequest<ResumeVersion>(
        `/resumes/${version.id}/suggestion-review`,
        {
          method: "POST",
          body: JSON.stringify({ expected_revision: version.review_revision, decisions: staged.map(([suggestion_id, decision]) => ({ suggestion_id, ...decision })) }),
        },
      );
      selectVersion(updated);
      setMessage("Suggestion decisions saved together. Rejected wording remains unchanged.");
      setState("idle");
    } catch (error) {
      if (error instanceof ApiError && error.code === "resume_review_revision_conflict") {
        try { await reconcileConflict(version); } catch { setState("error"); setMessage("A newer review exists, but it could not be loaded. Refresh before editing again."); }
        return;
      }
      setState("error");
      setMessage("That wording may add a claim your resume does not support. Edit it to match your resume or reject it.");
    }
  }

  async function generateVersion() {
    setState("saving");
    try {
      const payload = resumePayload(draft);
      const verifiedReadiness = await csrfRequest<ResumeReadiness>("/resumes/readiness", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setServerReadiness(verifiedReadiness);
      if (!verifiedReadiness.ready) {
        setState("idle");
        setMessage(`Complete the required details first: ${verifiedReadiness.blocking.join(" ")}`);
        return;
      }
      const created = await csrfRequest<ResumeVersion>("/resumes/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setGenerated(created);
      setState(created.status === "completed" ? "idle" : "processing");
      setMessage(created.status === "completed" ? `Resume version ${created.version_number} is ready.` : "Resume generation is queued in the local document worker…");
    } catch (error) {
      setState("error");
      setMessage(error instanceof ApiError && error.code === "resume_not_ready"
        ? "Add your name, a valid email address, and at least one education entry before generating."
        : "Resume generation could not be queued. Your saved profile has not been changed.");
    }
  }

  async function retryGeneration() {
    if (!generated) return;
    setState("saving");
    try {
      const queued = await csrfRequest<ResumeVersion>(`/resumes/${generated.id}/retry`, { method: "POST" });
      setGenerated(queued);
      setState("processing");
      setMessage("Resume generation has been queued for another attempt.");
    } catch {
      setState("error");
      setMessage("That generation cannot be retried yet. Check the local PDF compiler and try again.");
    }
  }

  if (state === "loading") {
    return (
      <main id="main-content" className={styles.page} aria-busy="true">
        <div className={styles.loading} role="status">
          <LoaderCircle aria-hidden="true" />
          <div>
            <h1>Resume review</h1>
            <p>Loading review workspace…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!version && !manualMode) {
    return <main id="main-content" className={styles.page}><div className={styles.empty}><FileDown aria-hidden="true" /><h1>No resume is ready for review</h1><p>Create a version from the profile details you have reviewed in Resume Generator.</p><Link href="/resume"><ArrowLeft size={16} aria-hidden="true" /> Return to resumes</Link></div></main>;
  }

  const previewName = draft.fullName || "Your name";
  const previewEmail = draft.email || "Email awaiting review";
  const previewSkills = lines(draft.skills);
  const previewProjects = lines(draft.projects);
  const previewEducation = lines(draft.education);
  const previewExperience = lines(draft.experience);
  const previewCredentials = lines(draft.credentials);
  const previewResearch = lines(draft.research);
  const previewPublications = lines(draft.publications);
  const previewAchievements = lines(draft.achievements);
  const prefilledSections = [draft.skills, draft.projects, draft.education, draft.experience, draft.credentials, draft.research, draft.publications].filter((item) => item.trim()).length;
  const updateDraft = (field: keyof ResumeDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <main id="main-content" className={styles.page}>
      {onboardingStep ? <section className={styles.onboardingProgress} aria-label="Student onboarding, step six of six">
        <div><strong>Step 6 of 6</strong><span>Profile saved · create your resume</span></div>
        <div className={styles.progressTrack} role="progressbar" aria-label="Onboarding progress" aria-valuemin={1} aria-valuemax={6} aria-valuenow={6} aria-valuetext="Step 6 of 6: Resume Generator"><span /></div>
      </section> : null}
      <header className={styles.header}>
        <div><h1>{manualMode ? "Resume Generator" : "Resume review"}</h1><span>{manualMode ? "Your saved profile fills in the first draft. Review it, add anything missing, then generate a PDF." : "Check each proposed detail before creating a new PDF."}</span></div>
        <div className={styles.headerActions}>
          {generated?.status === "completed" ? <>
            <a className={styles.download} href={apiPath(`/resumes/${generated.id}/download`)}><Download size={17} aria-hidden="true" /> Download PDF</a>
            {onboardingStep ? <button className={styles.continue} type="button" onClick={() => router.replace("/dashboard")}>Continue to workspace</button> : null}
          </> : generated?.status === "failed" && generated.job?.retryable ? <button className={styles.download} type="button" onClick={() => void retryGeneration()} disabled={state === "saving"}><RefreshCw size={17} aria-hidden="true" /> Retry generation</button> : <button className={styles.download} type="button" onClick={() => void generateVersion()} disabled={Boolean(version && version.status !== "completed") || state === "saving" || state === "processing" || !readiness.ready}><FileDown size={17} aria-hidden="true" />{state === "processing" ? " Generating…" : " Generate resume"}</button>}
        </div>
      </header>

      {message && <Alert tone={state === "error" ? "error" : "success"}>{message}</Alert>}
      {manualMode ? <section className={styles.readiness} aria-labelledby="readiness-title">
        <div><strong id="readiness-title">{readiness.ready ? "Ready to generate" : "Complete required details"}</strong><span>{readiness.ready ? "Your education, name, and email are present." : "A name, email, and at least one education entry are required."}</span></div>
        {readiness.blocking.length > 0 ? <ul>{readiness.blocking.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        {readiness.ready && readiness.warnings.length > 0 ? <details><summary>{readiness.warnings.length} optional suggestions</summary><ul>{readiness.warnings.map((item) => <li key={item}>{item}</li>)}</ul></details> : null}
        {serverReadiness?.ready && serverReadiness.informational.length > 0 ? <small>{serverReadiness.informational[0]}</small> : null}
      </section> : null}
      {generated ? <details className={styles.generatedEvidence}><summary>{generated.status === "completed" ? "How this version was created" : generated.status === "failed" ? "Generation details" : "Generation progress"}</summary><dl><div><dt>Status</dt><dd>{generated.status}</dd></div><div><dt>Template</dt><dd>{generated.extracted_data.template_id ?? "CampusHire Modern"} v{generated.extracted_data.template_version ?? "1"}</dd></div><div><dt>Pages</dt><dd>{generated.page_count ?? "Pending"}</dd></div><div><dt>Generator</dt><dd>{generated.generator_version ?? "CampusHire generator"}</dd></div><div><dt>Content reference</dt><dd><code>{generated.evidence_digest}</code></dd></div></dl><p>This reference identifies the reviewed information used for this PDF. It does not verify your credentials.</p></details> : null}

      <div className={styles.grid}>
        <section className={styles.paper} aria-label="Resume preview">
          <div className={styles.templateName}>CampusHire Modern · A4</div>
          <div className={styles.paperHeader}>
            <h2>{previewName}</h2>
            <p>{[draft.phone && `Phone: ${draft.phone}`, `Email: ${previewEmail}`, draft.githubUrl && `GitHub: ${draft.githubUrl.replace("https://", "")}`, draft.linkedinUrl && `LinkedIn: ${draft.linkedinUrl.replace("https://", "")}`, draft.portfolioUrl && `Portfolio: ${draft.portfolioUrl.replace("https://", "")}`].filter(Boolean).join("  |  ")}</p>
          </div>
          {draft.summary && <section><h3>Profile</h3><p className={styles.summary}>{draft.summary}</p></section>}
          {previewExperience.length > 0 && <section><h3>Experience</h3><ul>{previewExperience.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewProjects.length > 0 && <section><h3>Projects</h3><ul>{previewProjects.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewEducation.length > 0 && <section><h3>Education</h3><ul>{previewEducation.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewResearch.length > 0 && <section><h3>Research</h3><ul>{previewResearch.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewPublications.length > 0 && <section><h3>Publications</h3><ul>{previewPublications.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewCredentials.length > 0 && <section><h3>Certifications &amp; credentials</h3><ul>{previewCredentials.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {(previewSkills.length > 0 || previewAchievements.length > 0) && <section><h3>Skills and achievements</h3>{previewSkills.length > 0 && <p><strong>Skills:</strong> {previewSkills.join(", ")}</p>}{previewAchievements.length > 0 && <ul>{previewAchievements.map((item) => <li key={item}>{item}</li>)}</ul>}</section>}
        </section>

        <aside className={styles.review} aria-label="Resume review decisions">
          <section className={styles.resumeForm} aria-labelledby="resume-content-title">
            <div className={styles.formHeading}><div><h2 id="resume-content-title">Review your details</h2></div><span>CampusHire Classic · A4</span></div>
            <p className={styles.formIntro}>Your saved profile details are prefilled. Changes here only affect this resume.</p>
            <div className={styles.formGrid}>
              <label>Full name<input value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} maxLength={160} required /></label>
              <label>Email<input type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} maxLength={320} required /></label>
              <label>Phone<input value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} maxLength={24} /></label>
              <label>GitHub URL<input type="url" value={draft.githubUrl} onChange={(event) => updateDraft("githubUrl", event.target.value)} maxLength={500} /></label>
              <label>LinkedIn URL<input type="url" value={draft.linkedinUrl} onChange={(event) => updateDraft("linkedinUrl", event.target.value)} maxLength={500} /></label>
              <label className={styles.fullField}>Portfolio URL<input type="url" value={draft.portfolioUrl} onChange={(event) => updateDraft("portfolioUrl", event.target.value)} maxLength={500} /></label>
              <label className={styles.fullField}>Career focus and professional summary<textarea aria-label="Career focus and professional summary" value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} maxLength={900} rows={4} /></label>
            </div>
            <details className={styles.optionalSections}>
              <summary>Review {prefilledSections} prefilled profile sections and add more</summary>
              <p>Keep one item per line. Leave a section blank or enter N/A if it does not apply.</p>
              <div className={styles.formGrid}>
              <label className={styles.fullField}>Projects<textarea aria-label="Projects" value={draft.projects} onChange={(event) => updateDraft("projects", event.target.value)} placeholder="Project name — impact, technologies, or link" /></label>
              <label className={styles.fullField}>Education<textarea aria-label="Education" value={draft.education} onChange={(event) => updateDraft("education", event.target.value)} placeholder="Degree — institution · year" /></label>
              <label className={styles.fullField}>Experience<textarea aria-label="Experience" value={draft.experience} onChange={(event) => updateDraft("experience", event.target.value)} placeholder="Organization — role · dates" /></label>
              <label className={styles.fullField}>Research<textarea aria-label="Research" value={draft.research} onChange={(event) => updateDraft("research", event.target.value)} placeholder="Research area — contribution or methods" /></label>
              <label className={styles.fullField}>Publications<textarea aria-label="Publications" value={draft.publications} onChange={(event) => updateDraft("publications", event.target.value)} placeholder="Title — venue, year, link" /></label>
              <label className={styles.fullField}>Certifications & credentials<textarea aria-label="Certifications and credentials" value={draft.credentials} onChange={(event) => updateDraft("credentials", event.target.value)} placeholder="Credential — issuer, year" /></label>
              <label className={styles.fullField}>Skills<textarea aria-label="Skills" value={draft.skills} onChange={(event) => updateDraft("skills", event.target.value)} placeholder="One skill per line" /></label>
              <label className={styles.fullField}>Achievements<textarea aria-label="Achievements" value={draft.achievements} onChange={(event) => updateDraft("achievements", event.target.value)} placeholder="One factual achievement per line" /></label>
              <label className={styles.fullField}>Positions of responsibility<textarea aria-label="Positions of responsibility" value={draft.positions} onChange={(event) => updateDraft("positions", event.target.value)} placeholder="Role — organization, dates, contribution" /></label>
              <label className={styles.fullField}>Extracurricular activities<textarea aria-label="Extracurricular activities" value={draft.extracurricular} onChange={(event) => updateDraft("extracurricular", event.target.value)} placeholder="Activity — role or contribution" /></label>
              </div>
            </details>
            {onboardingStep && !generated ? <div className={styles.deferResume}>
              <p>If you skip now, you can create this later from Preparation → Resume Generator. Later creation is manual only.</p>
              <button type="button" onClick={() => router.replace("/dashboard")} disabled={state === "saving" || state === "processing"}>Skip for now</button>
            </div> : null}
          </section>

          {version ? <>
          <div className={styles.score}><Sparkles size={20} aria-hidden="true" /><div><span>Review state</span><strong>{version.status === "completed" ? "Complete" : `${unresolvedFields} fields left`}</strong></div></div>
          <p className={styles.guardrail}>Suggestions and extraction proposals never become resume claims until you decide.</p>

          <section className={styles.extraction} aria-labelledby="extraction-title">
            <p>Details found in your resume</p>
            <h2 id="extraction-title">Review the source facts</h2>
            {proposedEntries.length === 0 ? <span>No structured fields were proposed from this PDF.</span> : proposedEntries.map(([field, proposed]) => {
              const decision = decisions[field];
              return <div className={styles.fieldDecision} key={field}>
                <label htmlFor={`decision-${field}`}>{field.replaceAll("_", " ")}</label>
                <p>{displayValue(proposed)}</p>
                {version.status === "completed" ? <strong className={styles.recordedDecision}>Decision recorded: {decision?.action ?? "reviewed"}</strong> : <select id={`decision-${field}`} aria-label={`Decision for ${field.replaceAll("_", " ")}`} value={decision?.action ?? "pending"} onChange={(event) => setDecisions((current) => ({ ...current, [field]: { ...current[field], action: event.target.value as FieldDecision["action"] } }))}>
                  <option value="pending">Choose a decision…</option>
                  <option value="accept">Accept as shown</option>
                  <option value="edit">Edit before accepting</option>
                  <option value="reject">Reject field</option>
                </select>}
                {version.status !== "completed" && decision?.action === "edit" && <input aria-label={`Edited value for ${field.replaceAll("_", " ")}`} value={displayValue(decision.value)} onChange={(event) => setDecisions((current) => ({ ...current, [field]: { ...current[field], value: Array.isArray(proposed) ? event.target.value.split(",").map((item) => item.trim()).filter(Boolean) : event.target.value } }))} />}
              </div>;
            })}
            {proposedEntries.length > 0 && version.status !== "completed" && <button type="button" className={styles.primary} onClick={() => void saveExtraction()} disabled={state === "saving"}>Save extraction decisions</button>}
          </section>

          {version.suggestions.map((suggestion, index) => <article className={styles.suggestion} key={suggestion.id}>
            <p>Clarity suggestion / {String(index + 1).padStart(2, "0")}</p>
            <h2>Review proposed wording</h2>
            <del>{suggestion.original_text}</del>
            {editingSuggestion === suggestion.id ? <textarea aria-label="Edit proposed resume language" value={suggestionCopy[suggestion.id] ?? suggestion.proposed_text} onChange={(event) => setSuggestionCopy((current) => ({ ...current, [suggestion.id]: event.target.value }))} /> : <blockquote>{suggestion.decided_text ?? suggestion.proposed_text}</blockquote>}
            <small>{suggestion.rationale}</small>
            {suggestion.status === "pending" ? <div className={styles.actions}>
              {suggestionDecisions[suggestion.id] ? <><span className={styles.accepted}>Staged: {suggestionDecisions[suggestion.id].action}</span><button type="button" className={styles.secondary} onClick={() => setSuggestionDecisions((current) => { const next = { ...current }; delete next[suggestion.id]; return next; })}>Undo</button></> : <>
              <button type="button" className={styles.secondary} onClick={() => stageSuggestion(suggestion, "reject")} aria-label="Reject suggestion"><X size={15} aria-hidden="true" /> Reject</button>
              {editingSuggestion === suggestion.id ? <button type="button" className={styles.primary} onClick={() => stageSuggestion(suggestion, "edit")} aria-label="Stage edited suggestion"><Check size={15} aria-hidden="true" /> Stage edit</button> : <button type="button" className={styles.secondary} onClick={() => setEditingSuggestion(suggestion.id)} aria-label="Edit suggestion"><Edit3 size={15} aria-hidden="true" /> Edit</button>}
              <button type="button" className={styles.primary} onClick={() => stageSuggestion(suggestion, "accept")} aria-label="Accept suggestion"><Check size={15} aria-hidden="true" /> Accept</button></>}
            </div> : <p className={styles.accepted} role="status">Decision recorded: {suggestion.status}.</p>}
          </article>)}
          {Object.keys(suggestionDecisions).length ? <button type="button" className={styles.primary} disabled={state === "saving"} onClick={() => void saveSuggestions()}>Save {Object.keys(suggestionDecisions).length} suggestion decision{Object.keys(suggestionDecisions).length === 1 ? "" : "s"}</button> : null}
          </> : <p className={styles.guardrail}>Profile details are prefilled when available. The generated file stays private and is saved as a new version.</p>}
        </aside>
      </div>
    </main>
  );
}
