"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { apiPath, apiRequest, csrfRequest } from "@/lib/api/client";
import type { ResumeUpload, ResumeVersion } from "./types";
import styles from "./resume-workspace.module.css";

const statusCopy: Record<ResumeVersion["status"], string> = {
  queued: "Queued for safety checks",
  processing: "Scanning and extracting",
  review_required: "Your review is required",
  completed: "Reviewed and ready",
  failed: "Processing failed",
};

const failureCopy: Record<string, string> = {
  resume_malware_detected: "This file was quarantined because a malware signature was found.",
  resume_scan_unavailable: "The safety scanner is temporarily unavailable. CampusHire will retry safely.",
  resume_storage_unavailable: "Secure document storage is temporarily unavailable.",
  resume_encrypted: "Password-protected PDFs cannot be processed.",
  resume_page_limit: "The PDF exceeds the supported page limit.",
  resume_malformed: "The file does not contain a valid readable PDF structure.",
};

function mergeVersion(current: ResumeVersion[], version: ResumeVersion) {
  const others = current.filter((item) => item.id !== version.id);
  return [version, ...others].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function isResumeVersion(value: unknown): value is ResumeVersion {
  return Boolean(value && typeof value === "object" && "id" in value && "status" in value);
}

export function ResumeWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [state, setState] = useState<"loading" | "idle" | "uploading" | "complete" | "error">("loading");
  const [message, setMessage] = useState("");

  const loadVersions = useCallback(async () => {
    try {
      const loaded = await apiRequest<ResumeVersion[]>("/resumes", { cache: "no-store" });
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
    const timeout = window.setTimeout(async () => {
      const settled = await Promise.allSettled(
        pendingIds.map((id) => apiRequest<ResumeVersion>(`/resumes/${id}`, { cache: "no-store" })),
      );
      setVersions((current) => settled.reduce(
        (next, result) => result.status === "fulfilled" && isResumeVersion(result.value)
          ? mergeVersion(next, result.value)
          : next,
        current,
      ));
    }, 1_500);
    return () => window.clearTimeout(timeout);
  }, [pendingIds]);

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || file.type !== "application/pdf") {
      setState("error");
      setMessage("Choose a PDF no larger than 5 MB.");
      return;
    }
    setState("uploading");
    setMessage("");
    const body = new FormData();
    body.append("file", file);
    try {
      const uploaded = await csrfRequest<ResumeUpload>("/resumes", { method: "POST", body });
      const version = await apiRequest<ResumeVersion>(`/resumes/${uploaded.id}`, { cache: "no-store" });
      if (!isResumeVersion(version)) throw new Error("Invalid resume detail response");
      setVersions((current) => mergeVersion(current, version));
      setState("complete");
      setMessage(uploaded.duplicate ? "That exact PDF already exists, so its existing version was kept." : "Resume stored in quarantine. Safety checks and extraction are now running.");
    } catch {
      setState("error");
      setMessage("The PDF could not be accepted. Check its type and size, then retry.");
    }
  }

  async function retry(version: ResumeVersion) {
    try {
      const retried = await csrfRequest<ResumeVersion>(`/resumes/${version.id}/retry`, { method: "POST" });
      setVersions((current) => mergeVersion(current, retried));
    } catch {
      setMessage("This processing job could not be retried. Refresh its status before trying again.");
      setState("error");
    }
  }

  const nextReview = versions.find((item) => item.status === "review_required");

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Student documents</p>
          <h1>Resume</h1>
          <p>Every upload becomes a separate version. Extracted evidence remains proposed until you review it.</p>
        </div>
        <Link href={nextReview ? `/resume/builder?version=${nextReview.id}` : "/resume/builder"} className={styles.builderLink}>Open review workspace <ArrowRight size={17} aria-hidden="true" /></Link>
      </header>

      <div className={styles.grid}>
        <form className={styles.uploadCard} onSubmit={upload}>
          <div className={styles.cardLabel}><FileText size={18} aria-hidden="true" /> New version</div>
          <h2>Upload your latest PDF</h2>
          <p>The original is stored outside the public web root and cannot be downloaded until its scan is clean.</p>
          <label className={styles.filePicker}>
            <Upload size={24} aria-hidden="true" />
            <span><strong>{file?.name ?? "Choose a PDF"}</strong><small>PDF · up to 5 MB · maximum 3 pages</small></span>
            <input
              aria-label="Resume PDF"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setState("idle");
                setMessage("");
              }}
            />
          </label>
          <button className={styles.primaryAction} disabled={!file || state === "uploading" || state === "loading"}>
            {state === "uploading" ? <><LoaderCircle className={styles.spinner} size={17} aria-hidden="true" /> Securing PDF…</> : "Upload resume"}
          </button>
          {message && <Alert tone={state === "complete" ? "success" : "error"}>{state === "complete" && <FileCheck2 size={18} aria-hidden="true" />}{message}</Alert>}
        </form>

        <aside className={styles.processCard} aria-labelledby="resume-process-title">
          <div className={styles.status}><span /> Evidence pipeline / review-gated</div>
          <ShieldCheck size={26} aria-hidden="true" />
          <h2 id="resume-process-title">Nothing changes silently</h2>
          <ol>
            <li><span>01</span><div><strong>Quarantine and scan</strong><p>Opaque storage, MIME limits, and malware screening</p></div></li>
            <li><span>02</span><div><strong>Structured extraction</strong><p>Proposed contact, education, skills, and projects</p></div></li>
            <li><span>03</span><div><strong>Your decision</strong><p>Accept, edit, or reject every proposed change</p></div></li>
          </ol>
        </aside>
      </div>

      <section className={styles.versions} aria-labelledby="versions-title" aria-busy={state === "loading"}>
        <div className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>Immutable history</p><h2 id="versions-title">Resume versions</h2></div>
          <button type="button" className={styles.refresh} onClick={() => void loadVersions()}><RefreshCw size={15} aria-hidden="true" /> Refresh</button>
        </div>
        {state === "loading" && <div className={styles.emptyState} role="status"><LoaderCircle className={styles.spinner} aria-hidden="true" /> Loading saved versions…</div>}
        {state !== "loading" && versions.length === 0 && <div className={styles.emptyState}><FileText aria-hidden="true" /><strong>No resume versions yet</strong><span>Your first validated PDF will appear here with its review state.</span></div>}
        <div className={styles.versionList}>{versions.map((version) => (
          <article className={styles.versionCard} key={version.id}>
            <div className={styles.versionIcon} data-state={version.status}>{version.status === "failed" ? <ShieldAlert aria-hidden="true" /> : version.status === "completed" ? <CheckCircle2 aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</div>
            <div className={styles.versionMain}>
              <div><strong>{version.original_name}</strong><span>Version {version.version_number ?? "legacy"} · {version.source === "generated" ? "CampusHire PDF" : "Uploaded PDF"}</span></div>
              <p>{statusCopy[version.status]}</p>
              {version.safe_error_code && <small>{failureCopy[version.safe_error_code] ?? "Processing stopped safely. No extracted data was accepted."}</small>}
            </div>
            <div className={styles.versionActions}>
              {version.status === "review_required" && <Link href={`/resume/builder?version=${version.id}`}>Review changes <ArrowRight size={15} aria-hidden="true" /></Link>}
              {version.scan_status === "clean" && <a href={apiPath(`/resumes/${version.id}/download`)}><Download size={15} aria-hidden="true" /> Download</a>}
              {version.job?.retryable && version.job.status === "failed" && <button type="button" onClick={() => void retry(version)}><RefreshCw size={15} aria-hidden="true" /> Retry</button>}
            </div>
          </article>
        ))}</div>
      </section>
    </main>
  );
}
