"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Bot, ExternalLink, LoaderCircle, MessageSquareText, ShieldCheck, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import { AgentRunWorkspace } from "./agent-run-workspace";
import styles from "./copilot-workspace.module.css";

type Audience = "student" | "tnp";
type Citation = { source_type: string; source_id: string; label: string };
type Message = { id: string; role: string; content: string; citations: Citation[]; missing_evidence: string[]; proposal_id: string | null; created_at: string };
type Conversation = { id: string; audience: Audience; title: string; expires_at: string; messages: Message[] };
type CopilotProposal = { id: string; status: string; revision: number; content: { title: string; body: string; source_ids: string[] }; provider_name: string; model_version: string; prompt_version: string };

const studentIntents = [
  ["explain_eligibility", "Explain eligibility"],
  ["explain_role_match", "Explain role match and missing skills"],
  ["improve_profile_or_resume", "Improve profile or resume wording"],
  ["preparation_roadmap", "Generate a preparation roadmap"],
] as const;
const tnpIntents = [
  ["draft_role_description", "Draft role description"],
  ["extract_requirements", "Extract reviewable requirements"],
  ["draft_eligibility_rules", "Draft eligibility rules"],
  ["detect_contradictions", "Detect contradictory criteria"],
  ["draft_announcement", "Draft announcement or reminder"],
  ["summarize_placement_funnel", "Summarize aggregate placement funnel"],
] as const;

export function CopilotWorkspace({ audience }: { audience: Audience }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [proposal, setProposal] = useState<CopilotProposal | null>(null);
  const [intent, setIntent] = useState<string>(audience === "student" ? studentIntents[0][0] : tnpIntents[0][0]);
  const [roleId, setRoleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const base = `/ai/${audience === "student" ? "student" : "tnp"}-copilot`;
  const intents = audience === "student" ? studentIntents : tnpIntents;

  useEffect(() => {
    void apiRequest<Conversation[]>(`${base}/conversations`, { cache: "no-store" })
      .then((items) => { setConversations(items); setConversation(items[0] ?? null); })
      .catch(() => undefined);
  }, [base]);

  async function start() {
    setBusy(true); setError("");
    try {
      const created = await csrfRequest<Conversation>(`${base}/conversations`, { method: "POST", body: JSON.stringify({ title: audience === "student" ? "Placement guidance" : "T&P drafting" }) });
      setConversation(created);
      setConversations((current) => [created, ...current]);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Copilot is unavailable."); }
    finally { setBusy(false); }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!conversation || !message.trim()) return;
    setBusy(true); setError("");
    try {
      const updated = await csrfRequest<Conversation>(`${base}/conversations/${conversation.id}/messages`, { method: "POST", body: JSON.stringify(audience === "student" ? { intent, message, role_id: roleId || null } : { intent, message }) });
      setConversation(updated); setMessage("");
      setConversations((current) => current.map((item) => item.id === updated.id ? updated : item));
      const proposalId = [...updated.messages].reverse().find((item) => item.proposal_id)?.proposal_id;
      if (audience === "tnp" && proposalId) setProposal(await apiRequest<CopilotProposal>(`${base}/proposals/${proposalId}`, { cache: "no-store" }));
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Copilot could not answer safely."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!conversation) return;
    await csrfRequest(`${base}/conversations/${conversation.id}`, { method: "DELETE" });
    const remaining = conversations.filter((item) => item.id !== conversation.id);
    setConversations(remaining); setConversation(remaining[0] ?? null); setProposal(null);
  }

  async function decideProposal(decision: "approve" | "reject") {
    if (!proposal) return;
    setBusy(true); setError("");
    try {
      const saved = await csrfRequest<CopilotProposal>(`${base}/proposals/${proposal.id}`, {
        method: "PUT",
        body: JSON.stringify({ expected_revision: proposal.revision, content: proposal.content }),
      });
      const updated = await csrfRequest<CopilotProposal>(`${base}/proposals/${proposal.id}/decision`, { method: "POST", body: JSON.stringify({ expected_revision: saved.revision, decision }) });
      setProposal(updated);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Proposal decision could not be recorded."); }
    finally { setBusy(false); }
  }

  return (
    <>
    <AgentRunWorkspace audience={audience} />
    <main className={styles.page} aria-label="Private copilot conversations">
      <header><div><p>{audience === "student" ? "Private student guidance" : "Private T&P drafting"}</p><h2>{audience === "student" ? "Student Copilot" : "T&P Copilot"}</h2><span>{audience === "student" ? "Grounded answers with deterministic eligibility evidence." : "Personal conversation history stays visible only to you."}</span></div>{conversation ? <div>{conversations.length ? <label>Conversation<select value={conversation.id} onChange={(event) => { setConversation(conversations.find((item) => item.id === event.target.value) ?? null); setProposal(null); }}>{conversations.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label> : null}<button type="button" onClick={() => void start()} disabled={busy}>New conversation</button><button type="button" onClick={() => void remove()}><Trash2 aria-hidden="true" /> Delete conversation</button></div> : null}</header>
      <Alert tone="info"><ShieldCheck aria-hidden="true" /> Copilot may explain, draft, and recommend. It cannot approve eligibility, publish, shortlist, rank candidates, or change records without confirmation.</Alert>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!conversation ? <section className={styles.empty}><Bot aria-hidden="true" /><h2>Start a private, 30-day conversation</h2><p>Memory is scoped to your account and institution. Accepted artifacts follow their normal retention policy.</p><button type="button" onClick={() => void start()} disabled={busy}>{busy ? "Starting…" : "Start conversation"}</button></section> : <div className={styles.layout}><section className={styles.chat} aria-live="polite">{conversation.messages.length === 0 ? <div className={styles.welcome}><MessageSquareText aria-hidden="true" /><p>Choose a supported intent and ask a focused question.</p></div> : conversation.messages.map((item) => <article key={item.id} data-role={item.role}><strong>{item.role === "assistant" ? "CampusHire Copilot" : "You"}</strong><p>{item.content}</p>{item.citations.length ? <ul>{item.citations.map((citation) => <li key={`${citation.source_type}-${citation.source_id}`}>{citation.label} <small>{citation.source_type}</small></li>)}</ul> : null}{item.missing_evidence.length ? <Alert tone="warning">Missing evidence: {item.missing_evidence.join(", ")}</Alert> : null}{item.proposal_id && audience === "student" ? <Link href={`/resume/studio?proposal=${item.proposal_id}`}>Open proposal review <ExternalLink aria-hidden="true" /></Link> : null}</article>)}{busy ? <LoaderCircle className={styles.spinner} aria-label="Copilot is responding" /> : null}<form onSubmit={send}><label>Intent<select value={intent} onChange={(event) => setIntent(event.target.value as typeof intent)}>{intents.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{audience === "student" && intent !== "improve_profile_or_resume" ? <label>Published role ID<input value={roleId} onChange={(event) => setRoleId(event.target.value)} placeholder="Role ID" /></label> : null}<label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={audience === "student" ? 2000 : 4000} rows={4} required /></label><button type="submit" disabled={busy || !message.trim()}>Send</button></form></section>{proposal ? <aside className={styles.proposal}><p>Reviewable proposal</p><h2>{proposal.content.title}</h2><textarea value={proposal.content.body} onChange={(event) => setProposal({ ...proposal, content: { ...proposal.content, body: event.target.value } })} rows={14} disabled={proposal.status !== "draft"} /><small>{proposal.provider_name} · {proposal.model_version} · {proposal.prompt_version}</small>{proposal.status === "draft" ? <div><button type="button" className={styles.reject} onClick={() => void decideProposal("reject")}>Reject</button><button type="button" onClick={() => void decideProposal("approve")}>Approve proposal</button></div> : <Alert tone="success">Proposal {proposal.status}. Publishing or sending remains a separate authorized action.</Alert>}</aside> : null}</div>}
    </main>
    </>
  );
}
