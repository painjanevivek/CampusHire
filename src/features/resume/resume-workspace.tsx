"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  GitCompareArrows,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { apiPath, apiRequest, cachedApiRequest, csrfRequest } from "@/lib/api/client";
import type { ResumePipelineStage, ResumeVersion } from "./types";
import styles from "./resume-workspace.module.css";

const statusCopy: Record<ResumeVersion["status"], string> = {
  queued: "Queued for safety checks",
  processing: "Scanning and extracting",
  review_required: "Your review is required",
  completed: "Reviewed and ready",
  failed: "Processing failed",
  cancelled: "Processing cancelled",
};

const failureCopy: Record<string, string> = {
  resume_malware_detected: "This file was quarantined because a malware signature was found.",
  resume_scan_unavailable: "The safety scanner is temporarily unavailable. CampusHire will retry safely.",
  resume_storage_unavailable: "Secure document storage is temporarily unavailable.",
  resume_encrypted: "Password-protected PDFs cannot be processed.",
  resume_page_limit: "The PDF exceeds the supported page limit.",
  resume_malformed: "The file does not contain a valid readable PDF structure.",
  resume_worker_attempts_exhausted: "Processing stopped after the safe retry budget was exhausted.",
  resume_processing_unexpected: "Processing stopped safely because an unexpected worker error occurred.",
  resume_latex_compiler_unavailable: "The local LaTeX compiler is unavailable. Check the Resume Generator setup, then retry.",
  resume_latex_dependency_missing: "A required local LaTeX package is missing. Install the template packages, then retry.",
  resume_latex_compile_failed: "The PDF could not be compiled. Check the local TeX setup before retrying.",
  resume_template_unavailable: "The versioned resume template is unavailable. Restore the template file, then retry.",
  resume_pdf_invalid: "The generated PDF did not pass validation and was not saved as a completed version.",
  resume_pdf_too_large: "The generated PDF exceeds the supported file size.",
  resume_pdf_too_many_pages: "This resume is longer than the supported page limit. Shorten optional details and create a new version.",
  resume_job_cancelled: "Processing was cancelled by an authorized placement operator.",
};

const pipelineStages: Array<{ key: ResumePipelineStage; label: string }> = [
  { key: "quarantined", label: "Stored privately" },
  { key: "scanning", label: "Malware scan" },
  { key: "parsing", label: "Isolated extraction" },
  { key: "review", label: "Student review" },
  { key: "generating", label: "LaTeX PDF generation" },
  { key: "ready", label: "Ready for use" },
];

const pipelineCopy: Record<ResumePipelineStage, string> = {
  quarantined: "Stored privately and waiting for the malware scanner.",
  scanning: "The malware scanner is checking the quarantined file.",
  scan_retry: "The scanner is unavailable; the durable job will retry safely.",
  parsing: "A network-isolated parser is extracting proposed details.",
  parser_retry: "Extraction will retry; the private original remains unchanged.",
  review: "Extraction is complete and waiting for your decisions.",
  generating: "The local LaTeX worker is compiling a PDF from the reviewed profile details.",
  generated: "A reviewed CampusHire PDF was generated.",
  ready: "The reviewed CampusHire resume is ready for authorized use.",
  failed: "Processing stopped safely. No unreviewed detail was accepted.",
  cancelled: "Processing was cancelled; the file was not accepted for use.",
};

function progressStage(stage: ResumePipelineStage): ResumePipelineStage {
  if (stage === "scan_retry") return "scanning";
  if (stage === "parser_retry") return "parsing";
  if (stage === "generated") return "ready";
  return stage;
}

function mergeVersion(current: ResumeVersion[], version: ResumeVersion) {
  const others = current.filter((item) => item.id !== version.id);
  return [version, ...others].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function isResumeVersion(value: unknown): value is ResumeVersion {
  return Boolean(value && typeof value === "object" && "id" in value && "status" in value);
}

export function ResumeWorkspace() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [state, setState] = useState<"loading" | "idle" | "complete" | "error">("loading");
  const [message, setMessage] = useState("");
  const [compareIds, setCompareIds] = useState<[string, string]>(["", ""]);
  const [pollCycle, setPollCycle] = useState(0);
  const [pollFailures, setPollFailures] = useState(0);
  const [processingNotice, setProcessingNotice] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const loadVersions = useCallback(async (force = false) => {
    try {
      const loaded = await cachedApiRequest<ResumeVersion[]>("/resumes", { force });
      if (!Array.isArray(loaded)) throw new Error("Invalid resume list response");
      setVersions(loaded);
      setState("idle");
      setMessage("");
    } catch {
      setState("error");
      setMessage("Your resume versions could not be loaded. Your stored files are unchanged.");
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadVersions(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadVersions]);

  const pendingIds = useMemo(
    () => versions.filter((item) => item.status === "queued" || item.status === "processing").map((item) => item.id),
    [versions],
  );

  useEffect(() => {
    if (pendingIds.length === 0) return;
    let active = true;
    const timeout = window.setTimeout(async () => {
      const settled = await Promise.allSettled(
        pendingIds.map((id) => apiRequest<ResumeVersion>(`/resumes/${id}`, { cache: "no-store" })),
      );
      if (!active) return;
      const failed = settled.some((result) => result.status === "rejected");
      setVersions((current) => settled.reduce(
        (next, result) => result.status === "fulfilled" && isResumeVersion(result.value)
          ? mergeVersion(next, result.value)
          : next,
        current,
      ));
      setPollFailures((count) => failed ? Math.min(count + 1, 4) : 0);
      setProcessingNotice(failed ? "Processing is still running. Status refresh will retry automatically; you can safely leave this page." : "");
      setPollCycle((cycle) => cycle + 1);
    }, Math.min(1_500 * (2 ** pollFailures), 12_000));
    return () => { active = false; window.clearTimeout(timeout); };
  }, [pendingIds, pollCycle, pollFailures]);

  async function retry(version: ResumeVersion) {
    try {
      const retried = await csrfRequest<ResumeVersion>(`/resumes/${version.id}/retry`, { method: "POST" });
      setVersions((current) => mergeVersion(current, retried));
    } catch {
      setMessage("This processing job could not be retried. Refresh its status before trying again.");
      setState("error");
    }
  }

  async function deleteVersion(version: ResumeVersion) {
    if (version.locked_by_application || !window.confirm(`Delete ${version.original_name}? This cannot be undone.`)) return;
    try {
      await csrfRequest<void>(`/resumes/${version.id}`, { method: "DELETE" });
      setVersions((current) => current.filter((item) => item.id !== version.id));
      setMessage("Resume version and its private file were deleted.");
      setState("complete");
    } catch {
      setMessage("This version could not be deleted. Submitted applications keep their selected resume locked.");
      setState("error");
    }
  }

  function beginRename(version: ResumeVersion) {
    setRenamingId(version.id);
    setRenameDraft(version.original_name.replace(/\.pdf$/i, ""));
    setMessage("");
  }

  async function renameVersion(event: FormEvent<HTMLFormElement>, version: ResumeVersion) {
    event.preventDefault();
    const name = renameDraft.trim();
    if (!name || renameSaving) return;
    setRenameSaving(true);
    try {
      const updated = await csrfRequest<ResumeVersion>(`/resumes/${version.id}/name`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setVersions((current) => current.map((item) => item.id === version.id ? updated : item));
      setRenamingId(null);
      setMessage("Resume name updated.");
      setState("complete");
    } catch {
      setMessage("This resume could not be renamed. Check the name and try again.");
      setState("error");
    } finally {
      setRenameSaving(false);
    }
  }

  const compared = compareIds.map((id) => versions.find((item) => item.id === id));
  const comparisonFields = Array.from(new Set(compared.flatMap((item) => Object.keys(item?.extracted_data.accepted ?? item?.extracted_data.proposed ?? {}))));

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1>Resume Generator</h1>
          <p>Create a PDF from your saved profile. Review the prefilled details before you generate it.</p>
        </div>
        <Link href="/resume/builder?mode=manual" className={styles.builderLink}>Open resume generator <ArrowRight size={17} aria-hidden="true" /></Link>
      </header>

      <div className={styles.grid}>
        <section className={styles.uploadCard}>
          <div className={styles.cardLabel}><FileText size={18} aria-hidden="true" /> New resume version</div>
          <h2>Build from your saved profile</h2>
          <p>Your profile details fill in the draft. Add anything missing, then generate your PDF.</p>
          <Link className={styles.primaryAction} href="/resume/builder?mode=manual"><FileText size={17} aria-hidden="true" /> Open resume generator</Link>
          {message && <Alert tone={state === "complete" ? "success" : "error"}>{state === "complete" && <FileCheck2 size={18} aria-hidden="true" />}{message}</Alert>}
        </section>

        <details className={styles.processCard}>
          <summary>How resume generation works</summary>
          <ol>
            <li><span>1</span><div><strong>Review your saved details</strong><p>Profile information fills the form so you can correct it before using it.</p></div></li>
            <li><span>2</span><div><strong>Add anything missing</strong><p>Include optional research, publications, or other factual details.</p></div></li>
            <li><span>3</span><div><strong>Generate and download</strong><p>Your reviewed content becomes a new PDF version.</p></div></li>
          </ol>
        </details>
      </div>

      <section className={styles.versions} aria-labelledby="versions-title" aria-busy={state === "loading"}>
        <div className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>Saved history</p><h2 id="versions-title">Resume versions</h2></div>
          <button type="button" className={styles.refresh} onClick={() => void loadVersions(true)}><RefreshCw size={15} aria-hidden="true" /> Refresh</button>
        </div>
        {processingNotice ? <Alert tone="warning">{processingNotice}</Alert> : null}
        {state === "loading" && <div className={styles.emptyState} role="status"><LoaderCircle className={styles.spinner} aria-hidden="true" /> Loading saved versions…</div>}
        {state !== "loading" && versions.length === 0 && <div className={styles.emptyState}><FileText aria-hidden="true" /><strong>No resume versions yet</strong><span>Your first validated PDF will appear here with its review state.</span></div>}
        <div className={styles.versionList}>{versions.map((version) => (
          <article className={styles.versionCard} key={version.id}>
            <div className={styles.versionIcon} data-state={version.status}>{version.status === "failed" ? <ShieldAlert aria-hidden="true" /> : version.status === "completed" ? <CheckCircle2 aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</div>
            <div className={styles.versionMain}>
              {renamingId === version.id ? <form className={styles.renameForm} onSubmit={(event) => void renameVersion(event, version)}>
                <label className="srOnly" htmlFor={`resume-name-${version.id}`}>Resume file name</label>
                <input id={`resume-name-${version.id}`} value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} maxLength={120} required autoFocus />
                <button type="submit" disabled={renameSaving || !renameDraft.trim()}><Check size={15} aria-hidden="true" /> Save</button>
                <button type="button" onClick={() => setRenamingId(null)} disabled={renameSaving}>Cancel</button>
              </form> : <div><strong>{version.original_name}</strong><span>Version {version.version_number ?? "legacy"} · {version.source === "generated" ? "CampusHire PDF" : "Read-only legacy PDF"}</span></div>}
              <p>{statusCopy[version.status]}</p>
              <p className={styles.pipelineNow}>{pipelineCopy[version.processing_stage]}</p>
              {version.safe_error_code && <small>{failureCopy[version.safe_error_code] ?? "Processing stopped safely. No resume details were accepted."}</small>}
              <details className={styles.pipelineDetails}>
                <summary>Processing details</summary>
                <ol>{pipelineStages.map((stage) => {
                  const currentIndex = pipelineStages.findIndex((item) => item.key === progressStage(version.processing_stage));
                  const stageIndex = pipelineStages.findIndex((item) => item.key === stage.key);
                  const terminal = ["generated", "ready"].includes(version.processing_stage);
                  const complete = terminal || (currentIndex >= 0 && stageIndex < currentIndex);
                  return <li key={stage.key} data-state={stage.key === progressStage(version.processing_stage) ? "current" : complete ? "complete" : "upcoming"}>{stage.label}</li>;
                })}</ol>
                <dl><div><dt>Content reference</dt><dd><code>{version.evidence_digest}</code></dd></div>{version.generator_version ? <div><dt>Generator</dt><dd>{version.generator_version}</dd></div> : null}<div><dt>Review revision</dt><dd>{version.review_revision}</dd></div></dl>
              </details>
            </div>
            <div className={styles.versionActions}>
              {version.status === "review_required" && <Link href={`/resume/builder?version=${version.id}`}>Review changes <ArrowRight size={15} aria-hidden="true" /></Link>}
              {!version.locked_by_application && version.status !== "queued" && version.status !== "processing" && <button type="button" onClick={() => beginRename(version)}><Pencil size={15} aria-hidden="true" /> Rename</button>}
              {version.scan_status === "clean" && <a href={apiPath(`/resumes/${version.id}/download`)}><Download size={15} aria-hidden="true" /> Download</a>}
              {version.job?.retryable && version.job.status === "failed" && <button type="button" onClick={() => void retry(version)}><RefreshCw size={15} aria-hidden="true" /> Retry</button>}
              {version.locked_by_application ? <span className={styles.locked}><LockKeyhole size={15} aria-hidden="true" /> Locked by application</span> : version.status !== "queued" && version.status !== "processing" ? <button type="button" onClick={() => void deleteVersion(version)}><Trash2 size={15} aria-hidden="true" /> Delete</button> : null}
            </div>
          </article>
        ))}</div>
      </section>

      {versions.length > 1 ? <section className={styles.comparison} aria-labelledby="comparison-title">
        <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>Version comparison</p><h2 id="comparison-title">Compare resume versions</h2></div><GitCompareArrows aria-hidden="true" /></div>
        <div className={styles.compareSelectors}><label>Earlier version<select value={compareIds[0]} onChange={(event) => setCompareIds(([, right]) => [event.target.value, right])}><option value="">Choose version…</option>{versions.map((item) => <option key={item.id} value={item.id}>Version {item.version_number ?? "legacy"} · {item.original_name}</option>)}</select></label><label>Later version<select value={compareIds[1]} onChange={(event) => setCompareIds(([left]) => [left, event.target.value])}><option value="">Choose version…</option>{versions.map((item) => <option key={item.id} value={item.id}>Version {item.version_number ?? "legacy"} · {item.original_name}</option>)}</select></label></div>
        {compared.every(Boolean) ? <div className={styles.diffTable} role="table" aria-label="Resume version comparison"><div role="row"><strong role="columnheader">Field</strong><strong role="columnheader">Earlier</strong><strong role="columnheader">Later</strong></div>{comparisonFields.map((field) => { const values = compared.map((item) => item?.extracted_data.accepted?.[field] ?? item?.extracted_data.proposed?.[field]); return <div role="row" key={field} data-changed={JSON.stringify(values[0]) !== JSON.stringify(values[1])}><strong role="rowheader">{field.replaceAll("_", " ")}</strong><span role="cell">{Array.isArray(values[0]) ? values[0].join(", ") : String(values[0] ?? "Not present")}</span><span role="cell">{Array.isArray(values[1]) ? values[1].join(", ") : String(values[1] ?? "Not present")}</span></div>;})}</div> : <p className={styles.compareHelp}>Choose two versions to compare their reviewed details.</p>}
      </section> : null}
    </main>
  );
}
