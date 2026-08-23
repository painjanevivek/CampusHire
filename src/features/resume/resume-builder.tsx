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
import { apiPath, apiRequest, csrfRequest } from "@/lib/api/client";
import type { ResumeSuggestion, ResumeVersion } from "./types";
import styles from "./resume-builder.module.css";

type FieldDecision = {
  action: "pending" | "accept" | "edit" | "reject";
  value: string | string[];
};

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
  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [decisions, setDecisions] = useState<Record<string, FieldDecision>>({});
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null);
  const [suggestionCopy, setSuggestionCopy] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState("");
  const [generated, setGenerated] = useState<ResumeVersion | null>(null);
  const [state, setState] = useState<"loading" | "idle" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

  const selectVersion = useCallback((selected: ResumeVersion) => {
    setVersion(selected);
    setDecisions(initialDecisions(selected));
    setSuggestionCopy(Object.fromEntries(selected.suggestions.map((item) => [item.id, item.proposed_text])));
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setState("loading");
      try {
        const selected = requestedVersion
          ? await apiRequest<ResumeVersion>(`/resumes/${requestedVersion}`, { cache: "no-store" })
          : (await apiRequest<ResumeVersion[]>("/resumes", { cache: "no-store" }))
            .find((item) => item.status === "review_required");
        if (active && selected) selectVersion(selected);
        if (active) setState("idle");
      } catch {
        if (active) {
          setState("error");
          setMessage("The selected resume version could not be loaded.");
        }
      }
    }
    void load();
    return () => { active = false; };
  }, [requestedVersion, selectVersion]);

  const proposedEntries = useMemo(
    () => Object.entries(version?.extracted_data.proposed ?? {}),
    [version],
  );
  const unresolvedFields = Object.values(decisions).filter((item) => item.action === "pending").length;

  async function saveExtraction() {
    if (!version) return;
    if (unresolvedFields > 0) {
      setMessage(`Review ${unresolvedFields} remaining extracted field${unresolvedFields === 1 ? "" : "s"}.`);
      return;
    }
    setState("saving");
    try {
      const updated = await csrfRequest<ResumeVersion>(`/resumes/${version.id}/review`, {
        method: "POST",
        body: JSON.stringify({
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
    } catch {
      setState("error");
      setMessage("Those extraction decisions could not be saved. No proposed field was accepted.");
    }
  }

  async function decideSuggestion(suggestion: ResumeSuggestion, action: "accept" | "edit" | "reject") {
    if (!version) return;
    setState("saving");
    try {
      const updated = await csrfRequest<ResumeVersion>(
        `/resumes/${version.id}/suggestions/${suggestion.id}`,
        {
          method: "POST",
          body: JSON.stringify({
            action,
            ...(action === "edit" ? { edited_text: suggestionCopy[suggestion.id] } : {}),
          }),
        },
      );
      selectVersion(updated);
      setEditingSuggestion(null);
      setMessage(action === "reject" ? "Suggestion rejected. Your original wording remains unchanged." : "Suggestion decision saved to this version.");
      setState("idle");
    } catch {
      setState("error");
      setMessage("That wording could not be accepted because it may add an unsupported claim. Edit it to match your evidence or reject it.");
    }
  }

  async function generateVersion() {
    if (!version) return;
    const fullName = displayValue(resolvedValue(version, "full_name"));
    const email = displayValue(resolvedValue(version, "email"));
    if (!fullName || !email) {
      setMessage("Accept or edit both the full name and email fields before generating a PDF.");
      return;
    }
    const strings = (field: string) => {
      const value = resolvedValue(version, field);
      return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
    };
    setState("saving");
    try {
      const created = await csrfRequest<ResumeVersion>("/resumes/generate", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          summary,
          skills: strings("skills"),
          projects: strings("projects"),
          education: strings("education"),
          github_url: strings("links").find((value) => value.includes("github.com")) ?? null,
          portfolio_url: strings("links").find((value) => !value.includes("github.com")) ?? null,
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
    return <main id="main-content" className={styles.page}><div className={styles.loading} role="status"><LoaderCircle aria-hidden="true" /> Loading review workspace…</div></main>;
  }

  if (!version) {
    return <main id="main-content" className={styles.page}><div className={styles.empty}><FileDown aria-hidden="true" /><h1>No resume is ready for review</h1><p>Upload a PDF and wait for its safety check and extraction to finish.</p><Link href="/resume"><ArrowLeft size={16} aria-hidden="true" /> Return to resumes</Link></div></main>;
  }

  const previewName = displayValue(resolvedValue(version, "full_name")) || "Your name";
  const previewEmail = displayValue(resolvedValue(version, "email")) || "Email awaiting review";
  const previewSkills = displayValue(resolvedValue(version, "skills"));
  const previewProjects = displayValue(resolvedValue(version, "projects"));
  const previewEducation = displayValue(resolvedValue(version, "education"));

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><p>Evidence-backed review / version {version.version_number}</p><h1>Resume review</h1><span>Decide every extracted field and suggestion before generating a new PDF.</span></div>
        {generated ? <a className={styles.download} href={apiPath(`/resumes/${generated.id}/download`)}><Download size={17} aria-hidden="true" /> Download version {generated.version_number}</a> : <button className={styles.download} type="button" onClick={() => void generateVersion()} disabled={version.status !== "completed" || state === "saving"}><FileDown size={17} aria-hidden="true" /> Generate versioned PDF</button>}
      </header>

      {message && <Alert tone={state === "error" ? "error" : "success"}>{message}</Alert>}

      <div className={styles.grid}>
        <section className={styles.paper} aria-label="Resume preview">
          <div className={styles.paperHeader}><div><h2>{previewName}</h2><p>{previewEmail}</p></div><span>REVIEW / {String(version.version_number ?? 0).padStart(2, "0")}</span></div>
          <section><h3>Summary</h3><textarea className={styles.summaryInput} aria-label="Resume summary" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Add a concise, factual summary for the generated version." maxLength={900} /></section>
          {previewProjects && <section><h3>Projects</h3><p>{previewProjects}</p></section>}
          {previewSkills && <section><h3>Skills</h3><p className={styles.skills}>{previewSkills}</p></section>}
          {previewEducation && <section><h3>Education</h3><p>{previewEducation}</p></section>}
        </section>

        <aside className={styles.review} aria-label="Resume review decisions">
          <div className={styles.score}><Sparkles size={20} aria-hidden="true" /><div><span>Review state</span><strong>{version.status === "completed" ? "Complete" : `${unresolvedFields} fields left`}</strong></div></div>
          <p className={styles.guardrail}>Suggestions and extraction proposals never become resume claims until you decide.</p>

          <section className={styles.extraction} aria-labelledby="extraction-title">
            <p>Extracted fields</p>
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
              <button type="button" className={styles.secondary} onClick={() => void decideSuggestion(suggestion, "reject")} aria-label="Reject suggestion"><X size={15} aria-hidden="true" /> Reject</button>
              {editingSuggestion === suggestion.id ? <button type="button" className={styles.primary} onClick={() => void decideSuggestion(suggestion, "edit")} aria-label="Save edited suggestion"><Check size={15} aria-hidden="true" /> Save edit</button> : <button type="button" className={styles.secondary} onClick={() => setEditingSuggestion(suggestion.id)} aria-label="Edit suggestion"><Edit3 size={15} aria-hidden="true" /> Edit</button>}
              <button type="button" className={styles.primary} onClick={() => void decideSuggestion(suggestion, "accept")} aria-label="Accept suggestion"><Check size={15} aria-hidden="true" /> Accept</button>
            </div> : <p className={styles.accepted} role="status">Decision recorded: {suggestion.status}.</p>}
          </article>)}
        </aside>
      </div>
    </main>
  );
}
