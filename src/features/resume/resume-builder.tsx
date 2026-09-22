"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Download,
  Edit3,
  FileDown,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { ApiError, apiPath, apiRequest, csrfRequest } from "@/lib/api/client";
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
  portfolioUrl: string;
  summary: string;
  skills: string;
  projects: string;
  education: string;
  experience: string;
  credentials: string;
  achievements: string;
};

type ResumeProfile = {
  full_name: string | null;
  account_email: string | null;
  phone: string | null;
  education: Array<{
    degree?: string;
    branch?: string;
    institution?: string;
    graduation_year?: number;
  }>;
  skills: Array<{ name?: string }>;
  external_links: Record<string, string>;
};

const emptyDraft: ResumeDraft = {
  fullName: "",
  email: "",
  phone: "",
  githubUrl: "",
  portfolioUrl: "",
  summary: "",
  skills: "",
  projects: "",
  education: "",
  experience: "",
  credentials: "",
  achievements: "",
};

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function profileDraft(profile: ResumeProfile): ResumeDraft {
  return {
    ...emptyDraft,
    fullName: profile.full_name ?? "",
    email: profile.account_email ?? "",
    phone: profile.phone ?? "",
    githubUrl: profile.external_links.github ?? "",
    portfolioUrl: profile.external_links.portfolio ?? "",
    skills: profile.skills.map((item) => item.name).filter(Boolean).join("\n"),
    education: profile.education.map((item) => {
      const qualification = [item.degree, item.branch].filter(Boolean).join(" ");
      const institution = item.institution ? ` — ${item.institution}` : "";
      const year = item.graduation_year ? ` · ${item.graduation_year}` : "";
      return `${qualification}${institution}${year}`.trim();
    }).filter(Boolean).join("\n"),
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

export function ResumeBuilder() {
  const searchParams = useSearchParams();
  const requestedVersion = searchParams.get("version");
  const manualMode = searchParams.get("mode") === "manual";
  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [decisions, setDecisions] = useState<Record<string, FieldDecision>>({});
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null);
  const [suggestionCopy, setSuggestionCopy] = useState<Record<string, string>>({});
  const [suggestionDecisions, setSuggestionDecisions] = useState<Record<string, { action: "accept" | "edit" | "reject"; edited_text?: string }>>({});
  const [draft, setDraft] = useState<ResumeDraft>(emptyDraft);
  const [generated, setGenerated] = useState<ResumeVersion | null>(null);
  const [state, setState] = useState<"loading" | "idle" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

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
      portfolioUrl: links.find((value) => !value.includes("github.com")) ?? "",
      skills: values("skills").join("\n"),
      projects: values("projects").join("\n"),
      education: values("education").join("\n"),
      experience: values("experience").join("\n"),
      credentials: values("credentials").join("\n"),
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
          if (active) {
            setVersion(null);
            setDraft(profileDraft(profile));
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

  const proposedEntries = useMemo(
    () => Object.entries(version?.extracted_data.proposed ?? {}),
    [version],
  );
  const unresolvedFields = Object.values(decisions).filter((item) => item.action === "pending").length;

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
    if (!draft.fullName.trim() || !draft.email.trim()) {
      setMessage("Add both your full name and email before generating a PDF.");
      return;
    }
    setState("saving");
    try {
      const created = await csrfRequest<ResumeVersion>("/resumes/generate", {
        method: "POST",
        body: JSON.stringify({
          full_name: draft.fullName.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim() || null,
          github_url: draft.githubUrl.trim() || null,
          portfolio_url: draft.portfolioUrl.trim() || null,
          summary: draft.summary.trim(),
          skills: lines(draft.skills),
          projects: lines(draft.projects),
          education: lines(draft.education),
          experience: lines(draft.experience),
          credentials: lines(draft.credentials),
          achievements: lines(draft.achievements),
        }),
      });
      setGenerated(created);
      setState("idle");
      setMessage(`Version ${created.version_number} generated from your reviewed content.`);
    } catch {
      setState("error");
      setMessage("The PDF could not be generated. Your review decisions are still saved.");
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
    return <main id="main-content" className={styles.page}><div className={styles.empty}><FileDown aria-hidden="true" /><h1>No resume is ready for review</h1><p>Create a version from reviewed profile evidence in Resume Studio.</p><Link href="/resume"><ArrowLeft size={16} aria-hidden="true" /> Return to resumes</Link></div></main>;
  }

  const previewName = draft.fullName || "Your name";
  const previewEmail = draft.email || "Email awaiting review";
  const previewSkills = lines(draft.skills);
  const previewProjects = lines(draft.projects);
  const previewEducation = lines(draft.education);
  const previewExperience = lines(draft.experience);
  const previewCredentials = lines(draft.credentials);
  const previewAchievements = lines(draft.achievements);
  const updateDraft = (field: keyof ResumeDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><p>{manualMode ? "CampusHire Classic / A4" : `Review before use / version ${version?.version_number}`}</p><h1>{manualMode ? "Build your resume" : "Resume review"}</h1><span>{manualMode ? "Fill the sections once, preview the structure, and create a private versioned PDF." : "Check every detail and suggestion before creating a new PDF."}</span></div>
        {generated ? <a className={styles.download} href={apiPath(`/resumes/${generated.id}/download`)}><Download size={17} aria-hidden="true" /> Download version {generated.version_number}</a> : <button className={styles.download} type="button" onClick={() => void generateVersion()} disabled={Boolean(version && version.status !== "completed") || state === "saving"}><FileDown size={17} aria-hidden="true" /> Generate versioned PDF</button>}
      </header>

      {message && <Alert tone={state === "error" ? "error" : "success"}>{message}</Alert>}
      {generated ? <details className={styles.generatedEvidence}><summary>Generated version evidence</summary><dl><div><dt>Generator</dt><dd>{generated.generator_version ?? "CampusHire generator"}</dd></div><div><dt>Evidence digest</dt><dd><code>{generated.evidence_digest}</code></dd></div></dl><p>The digest identifies the reviewed content used for this PDF; it is not a credential verification.</p></details> : null}

      <div className={styles.grid}>
        <section className={styles.paper} aria-label="Resume preview">
          <div className={styles.templateName}>CampusHire Classic</div>
          <div className={styles.paperHeader}>
            <h2>{previewName}</h2>
            <p>{[draft.phone && `Phone: ${draft.phone}`, `Email: ${previewEmail}`, draft.githubUrl && `GitHub: ${draft.githubUrl.replace("https://", "")}`, draft.portfolioUrl && `Portfolio: ${draft.portfolioUrl.replace("https://", "")}`].filter(Boolean).join("  |  ")}</p>
          </div>
          {draft.summary && <section><h3>Profile</h3><p className={styles.summary}>{draft.summary}</p></section>}
          {previewProjects.length > 0 && <section><h3>Projects</h3><ul>{previewProjects.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewEducation.length > 0 && <section><h3>Education</h3><ul>{previewEducation.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewExperience.length > 0 && <section><h3>Experience</h3><ul>{previewExperience.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {previewCredentials.length > 0 && <section><h3>Open source, research, and certification</h3><ul>{previewCredentials.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          {(previewSkills.length > 0 || previewAchievements.length > 0) && <section><h3>Skills and achievements</h3>{previewSkills.length > 0 && <p><strong>Skills:</strong> {previewSkills.join(", ")}</p>}{previewAchievements.length > 0 && <ul>{previewAchievements.map((item) => <li key={item}>{item}</li>)}</ul>}</section>}
        </section>

        <aside className={styles.review} aria-label="Resume review decisions">
          <section className={styles.resumeForm} aria-labelledby="resume-content-title">
            <div className={styles.formHeading}><div><p>Template</p><h2 id="resume-content-title">CampusHire Classic</h2></div><span>A4 · single column</span></div>
            <p>Only the details entered here are rendered. Keep one project, education, experience, credential, skill, or achievement per line.</p>
            <div className={styles.formGrid}>
              <label>Full name<input value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} maxLength={160} required /></label>
              <label>Email<input type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} maxLength={320} required /></label>
              <label>Phone<input value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} maxLength={24} /></label>
              <label>GitHub URL<input type="url" value={draft.githubUrl} onChange={(event) => updateDraft("githubUrl", event.target.value)} maxLength={500} /></label>
              <label className={styles.fullField}>Portfolio URL<input type="url" value={draft.portfolioUrl} onChange={(event) => updateDraft("portfolioUrl", event.target.value)} maxLength={500} /></label>
              <label className={styles.fullField}>Professional summary<textarea aria-label="Professional summary" value={draft.summary} onChange={(event) => updateDraft("summary", event.target.value)} maxLength={900} /></label>
              <label className={styles.fullField}>Projects<textarea aria-label="Projects" value={draft.projects} onChange={(event) => updateDraft("projects", event.target.value)} placeholder="Project name — impact, technologies, or link" /></label>
              <label className={styles.fullField}>Education<textarea aria-label="Education" value={draft.education} onChange={(event) => updateDraft("education", event.target.value)} placeholder="Degree — institution · year" /></label>
              <label className={styles.fullField}>Experience<textarea aria-label="Experience" value={draft.experience} onChange={(event) => updateDraft("experience", event.target.value)} placeholder="Organization — role · dates" /></label>
              <label className={styles.fullField}>Research and certifications<textarea aria-label="Research and certifications" value={draft.credentials} onChange={(event) => updateDraft("credentials", event.target.value)} placeholder="Credential — issuer · date or status" /></label>
              <label className={styles.fullField}>Skills<textarea aria-label="Skills" value={draft.skills} onChange={(event) => updateDraft("skills", event.target.value)} placeholder="One skill per line" /></label>
              <label className={styles.fullField}>Achievements<textarea aria-label="Achievements" value={draft.achievements} onChange={(event) => updateDraft("achievements", event.target.value)} placeholder="One factual achievement per line" /></label>
            </div>
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
