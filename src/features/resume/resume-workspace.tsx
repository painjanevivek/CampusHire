"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, FileCheck2, FileText, ShieldCheck, Upload } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { csrfRequest } from "@/lib/api/client";
import styles from "./resume-workspace.module.css";

export function ResumeWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "complete" | "error">("idle");

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setState("uploading");
    const body = new FormData();
    body.append("file", file);
    try {
      await csrfRequest("/resumes", { method: "POST", body, headers: {} });
      setState("complete");
    } catch {
      setState("error");
    }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Resume evidence / PDF v3</p>
          <h1>Make every claim <em>traceable.</em></h1>
          <p>Your original file stays unchanged. Extracted evidence only affects matching after your review.</p>
        </div>
        <Link href="/resume/builder" className={styles.builderLink}>Open builder <ArrowRight size={17} aria-hidden="true" /></Link>
      </header>

      <div className={styles.grid}>
        <form className={styles.uploadCard} onSubmit={upload}>
          <div className={styles.cardLabel}><FileText size={18} aria-hidden="true" /> Resume intake</div>
          <h2>Upload your latest PDF</h2>
          <p>We check the file before creating a new immutable version. Nothing overwrites your original resume.</p>
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
              }}
            />
          </label>
          <button className={styles.primaryAction} disabled={!file || state === "uploading"}>
            {state === "uploading" ? "Checking PDF…" : "Upload resume"}
          </button>
          {state === "complete" && <Alert tone="success"><FileCheck2 size={18} aria-hidden="true" /> Resume accepted as a new immutable version.</Alert>}
          {state === "error" && <Alert tone="error">The PDF could not be accepted. Check its size, page count, and encryption, then retry.</Alert>}
        </form>

        <aside className={styles.processCard} aria-labelledby="resume-process-title">
          <div className={styles.status}><span /> Evidence pipeline / ready</div>
          <ShieldCheck size={26} aria-hidden="true" />
          <h2 id="resume-process-title">Review before matching</h2>
          <ol>
            <li><span>01</span><div><strong>Safety check</strong><p>Type, size, pages, and parser validation</p></div></li>
            <li><span>02</span><div><strong>Structured extraction</strong><p>Contact, education, skills, and projects</p></div></li>
            <li><span>03</span><div><strong>Your review</strong><p>Accept or correct every proposed change</p></div></li>
          </ol>
        </aside>
      </div>
    </main>
  );
}
