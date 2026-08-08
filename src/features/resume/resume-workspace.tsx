"use client";

import { useState, type FormEvent } from "react";
import { FileCheck2, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/feedback";
import { csrfRequest } from "@/lib/api/client";

export function ResumeWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "complete" | "error">("idle");

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    setState("uploading");
    const body = new FormData();
    body.append("file", file);
    try { await csrfRequest("/resumes", { method: "POST", body, headers: {} }); setState("complete"); }
    catch { setState("error"); }
  }

  return <main id="main-content" className="workspacePage"><header className="workspaceHeader"><div><p className="eyebrow">Resume workspace</p><h1>Turn one PDF into a reviewed profile.</h1></div><Badge>PDF · 5 MB · 3 pages</Badge></header><div className="workspaceGrid"><form className="uploadPanel" onSubmit={upload}><FileText size={34} aria-hidden="true"/><h2>Upload your latest resume</h2><p>The original stays unchanged. Extracted details wait for your review before affecting matching.</p><label className="filePicker"><Upload size={20}/><span>{file?.name ?? "Choose PDF"}</span><input type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/></label><Button disabled={!file || state === "uploading"}>{state === "uploading" ? "Checking PDF…" : "Upload resume"}</Button>{state === "complete" && <Alert tone="success"><FileCheck2 size={18}/> Resume accepted as a new immutable version.</Alert>}{state === "error" && <Alert tone="error">The PDF could not be accepted. Check its size, page count, and encryption.</Alert>}</form><aside className="processPanel"><p className="pathLabel">What happens next</p><ol><li><strong>1 · Safety check</strong><span>Type, size, pages, and parser validation</span></li><li><strong>2 · Structured extraction</strong><span>Contact, education, skills, and projects</span></li><li><strong>3 · Your review</strong><span>Accept or correct every proposed change</span></li></ol></aside></div></main>;
}
