"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, FileText, LoaderCircle, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./ai-resume-studio.module.css";

type Evidence = { evidence_id: string; kind: string; label: string; facts: string };
type Claim = { text: string; evidence_ids: string[] };
type Draft = { professional_summary: Claim | null; education: Claim[]; project_bullets: Claim[]; experience_bullets: Claim[]; skills: Claim[] };
type Proposal = { id: string; status: string; revision: number; content: Draft; evidence_references: Evidence[]; provider_name: string; model_version: string; prompt_version: string };

export function AiResumeStudio({ initialProposalId }: { initialProposalId?: string }) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [state, setState] = useState<"loading" | "idle" | "busy" | "error" | "complete">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void Promise.all([
      apiRequest<{ evidence: Evidence[] }>("/ai/resume-studio/evidence", { cache: "no-store" }),
      initialProposalId ? apiRequest<Proposal>(`/ai/resume-studio/proposals/${initialProposalId}`, { cache: "no-store" }) : Promise.resolve(null),
    ])
      .then(([result, loadedProposal]) => { setEvidence(result.evidence); setSelected(result.evidence.map((item) => item.evidence_id)); if (loadedProposal) { setProposal(loadedProposal); setDraft(loadedProposal.content); } setState("idle"); })
      .catch((cause) => { setMessage(cause instanceof ApiError ? cause.message : "Resume Studio is unavailable."); setState("error"); });
  }, [initialProposalId]);

  async function generate() {
    setState("busy"); setMessage("");
    try {
      const created = await csrfRequest<Proposal>("/ai/resume-studio/proposals", { method: "POST", body: JSON.stringify({ selected_evidence_ids: selected, purpose_role_id: null }) });
      setProposal(created); setDraft(created.content); setState("idle");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "A grounded draft could not be generated."); setState("error"); }
  }

  function editClaim(section: keyof Draft, index: number, value: string) {
    if (!draft) return;
    if (section === "professional_summary") {
      setDraft({ ...draft, professional_summary: draft.professional_summary ? { ...draft.professional_summary, text: value } : null });
      return;
    }
    const updated = [...draft[section]] as Claim[];
    updated[index] = { ...updated[index], text: value };
    setDraft({ ...draft, [section]: updated });
  }

  async function decide(decision: "accept" | "reject") {
    if (!proposal || !draft) return;
    setState("busy"); setMessage("");
    try {
      let current = proposal;
      if (JSON.stringify(draft) !== JSON.stringify(proposal.content)) {
        current = await csrfRequest<Proposal>(`/ai/resume-studio/proposals/${proposal.id}`, { method: "PUT", body: JSON.stringify({ expected_revision: proposal.revision, content: draft }) });
      }
      const reviewed = await csrfRequest<Proposal>(`/ai/resume-studio/proposals/${proposal.id}/decision`, { method: "POST", body: JSON.stringify({ expected_revision: current.revision, decision }) });
      setProposal(reviewed); setDraft(reviewed.content);
      if (decision === "reject") { setState("complete"); setMessage("Draft rejected. No profile or resume was changed."); return; }
      await csrfRequest(`/ai/resume-studio/proposals/${proposal.id}/versions`, { method: "POST", body: JSON.stringify({ parent_version_id: null }) });
      setState("complete"); setMessage("Accepted. A new immutable CampusHire PDF version was created.");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "The proposal decision could not be saved."); setState("error"); }
  }

  const evidenceMap = new Map(evidence.map((item) => [item.evidence_id, item]));
  return (
    <main id="main-content" className={styles.page}>
      <header><p>Generative AI · proposal only</p><h1>AI Resume Studio</h1><span>Select evidence → generate draft → validate claims → edit → accept → immutable PDF.</span></header>
      {message ? <Alert tone={state === "error" ? "error" : "success"}>{message}</Alert> : null}
      {!proposal ? <section className={styles.panel}><h2>Select reviewed evidence</h2><p>Direct identifiers are excluded from the model request. Every generated claim must cite selected evidence.</p><div className={styles.evidence}>{evidence.map((item) => <label key={item.evidence_id}><input type="checkbox" checked={selected.includes(item.evidence_id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.evidence_id] : current.filter((id) => id !== item.evidence_id))} /><span><strong>{item.label}</strong><small>{item.kind}</small></span></label>)}</div>{state === "loading" ? <LoaderCircle aria-hidden="true" /> : null}<button type="button" onClick={() => void generate()} disabled={state === "busy" || selected.length === 0}><Sparkles aria-hidden="true" /> {state === "busy" ? "Generating grounded draft…" : "Generate proposal"}</button><Link href="/resume/builder">Use manual builder instead</Link></section> : null}
      {proposal && draft ? <section className={styles.panel}><div className={styles.provenance}><Sparkles aria-hidden="true" /><span><strong>Generated proposal</strong><small>{proposal.provider_name} · {proposal.model_version} · {proposal.prompt_version}</small></span></div><div className={styles.claims}>{draft.professional_summary ? <label><span>Professional summary</span><textarea value={draft.professional_summary.text} onChange={(event) => editClaim("professional_summary", 0, event.target.value)} rows={4} /><small>Evidence: {draft.professional_summary.evidence_ids.map((id) => evidenceMap.get(id)?.label ?? id).join(", ")}</small></label> : null}{(["education", "project_bullets", "experience_bullets", "skills"] as const).flatMap((section) => draft[section].map((claim, index) => <label key={`${section}-${index}`}><span>{section.replaceAll("_", " ")} {index + 1}</span><textarea value={claim.text} onChange={(event) => editClaim(section, index, event.target.value)} rows={3} /><small>Evidence: {claim.evidence_ids.map((id) => evidenceMap.get(id)?.label ?? id).join(", ")}</small></label>))}</div><Alert tone="info"><Check aria-hidden="true" /> Accepting creates a new version. It never edits your profile or overwrites an earlier resume.</Alert>{proposal.status === "draft" ? <div className={styles.actions}><button type="button" className={styles.reject} onClick={() => void decide("reject")} disabled={state === "busy"}>Reject</button><button type="button" onClick={() => void decide("accept")} disabled={state === "busy"}><FileText aria-hidden="true" /> Accept and create PDF</button></div> : <Link href="/resume">Compare and download versions</Link>}</section> : null}
    </main>
  );
}
