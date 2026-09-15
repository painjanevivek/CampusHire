"use client";

import { useState, type FormEvent } from "react";

import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { useResource } from "@/features/experience/use-resource";
import { ApiError, csrfRequest } from "@/lib/api/client";
import styles from "./tnp-privacy-workspace.module.css";

type CurrentUser = { id: string };
type PrivacyRequest = {
  id: string;
  user_id: string | null;
  request_type: string;
  status: string;
  details: string | null;
  owner_user_id: string | null;
  due_at: string | null;
  result_summary: string | null;
  receipt_reference: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};
type LegalHold = { id: string; user_id: string | null; scope: Record<string, unknown>; reason: string; owner_user_id: string; review_at: string; released_at: string | null; release_reason: string | null; created_at: string; updated_at: string };

export function TnpPrivacyWorkspace() {
  const requests = useResource<PrivacyRequest[]>("/tnp/privacy/requests");
  const me = useResource<CurrentUser>("/auth/me");
  const holds = useResource<LegalHold[]>("/tnp/privacy/legal-holds");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  async function decide(event: FormEvent<HTMLFormElement>, item: PrivacyRequest) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const action = String(data.get("action"));
    if (action === "assign" && !me.data?.id) return;
    setBusy(item.id); setMessage("");
    try {
      await csrfRequest(`/tnp/privacy/requests/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          owner_user_id: action === "assign" ? me.data?.id : item.owner_user_id,
          reason: data.get("reason"),
          expected_updated_at: item.updated_at,
        }),
      });
      setMessage("Privacy request updated. The student-visible status and audit record now reflect this action.");
      requests.refresh();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The privacy request was not changed. Refresh before retrying.");
    } finally { setBusy(""); }
  }

  async function createHold(event: FormEvent<HTMLFormElement>, item: PrivacyRequest) {
    event.preventDefault();
    if (!item.user_id || !me.data?.id) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(`hold:${item.id}`); setMessage("");
    try {
      await csrfRequest("/tnp/privacy/legal-holds", { method: "POST", body: JSON.stringify({ user_id: item.user_id, scope: { privacy_request_id: item.id }, reason: data.get("reason"), owner_user_id: me.data.id, review_at: new Date(String(data.get("review_at"))).toISOString() }) });
      form.reset(); holds.refresh(); setMessage("Retention hold recorded with an owner and review date. You may now place the request in held status.");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "The retention hold was not recorded."); }
    finally { setBusy(""); }
  }

  async function releaseHold(event: FormEvent<HTMLFormElement>, hold: LegalHold) {
    event.preventDefault();
    const data = new FormData(event.currentTarget); setBusy(`release:${hold.id}`); setMessage("");
    try {
      await csrfRequest(`/tnp/privacy/legal-holds/${hold.id}/release`, { method: "PATCH", body: JSON.stringify({ reason: data.get("reason"), expected_updated_at: hold.updated_at }) });
      holds.refresh(); requests.refresh(); setMessage("Retention hold released. The release remains in the history.");
    } catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "The retention hold was not released."); }
    finally { setBusy(""); }
  }

  const active = requests.data?.filter(item => !["completed", "declined"].includes(item.status)).length ?? 0;
  return <PageContainer context="admin" className={styles.page}>
    <PageHeader eyebrow="Student data rights" title="Privacy requests" description="Assign institutional decisions, report valid holds, and show completion only after required processing finishes." />
    {message ? <Alert>{message}</Alert> : null}
    <section className={styles.summary}><p>Action-needed requests remain separate from completed receipts.</p><Badge tone={active ? "warning" : "success"}>{active} active</Badge></section>
    <details><summary>Retention holds <Badge tone={holds.data?.some(item => !item.released_at) ? "warning" : "neutral"}>{holds.data?.filter(item => !item.released_at).length ?? 0} active</Badge></summary><section className={styles.list}>{holds.data?.map(hold => <article className={styles.request} key={hold.id}><header><strong>{hold.released_at ? "Released hold" : "Active hold"}</strong><p>{hold.reason}</p><small>Review {new Date(hold.review_at).toLocaleString()} · Owner assigned</small></header><Badge tone={hold.released_at ? "neutral" : "warning"}>{hold.released_at ? "Released" : "Active"}</Badge><details><summary>Scope and release history</summary><pre>{JSON.stringify(hold.scope, null, 2)}</pre>{hold.release_reason ? <p>Release reason: {hold.release_reason}</p> : null}{!hold.released_at ? <form className={styles.form} onSubmit={(event) => void releaseHold(event, hold)}><label>Release reason<input name="reason" minLength={10} maxLength={1000} required /></label><Button disabled={busy === `release:${hold.id}`}>Release hold</Button></form> : null}</details></article>)}</section></details>
    {requests.loading ? <RequestState state="loading" title="Loading privacy requests">Reading the institution request ledger.</RequestState> : null}
    {requests.error ? <RequestState state="error" title="Privacy requests unavailable" onRetry={requests.refresh}>{requests.error}</RequestState> : null}
    <section className={styles.list} aria-label="Institution privacy requests">
      {requests.data?.map(item => <article className={styles.request} key={item.id}><header><strong>{item.request_type.replaceAll("_", " ")}</strong><p>{item.details || "No additional details submitted."}</p><small>Submitted {new Date(item.created_at).toLocaleString()}</small></header><Badge tone={item.status === "completed" ? "success" : item.status === "held" ? "warning" : "neutral"}>{item.status.replaceAll("_", " ")}</Badge><details open={!item.owner_user_id && !item.completed_at}><summary>Ownership, timing, and decision</summary><p>Owner: {item.owner_user_id ? "Assigned institution officer" : "Unassigned queue"} · Due: {item.due_at ? new Date(item.due_at).toLocaleString() : "Not scheduled"}</p>{item.result_summary ? <p>Result: {item.result_summary}</p> : null}{item.receipt_reference ? <p>Receipt: <code>{item.receipt_reference}</code></p> : null}{item.user_id && !holds.data?.some(hold => hold.user_id === item.user_id && !hold.released_at) ? <details><summary>Create a retention hold</summary><form className={styles.form} onSubmit={(event) => void createHold(event, item)}><label>Review date<input name="review_at" type="datetime-local" required /></label><label>Legal or policy reason<input name="reason" minLength={10} maxLength={1000} required /></label><Button disabled={busy === `hold:${item.id}`}>Record hold</Button></form></details> : null}{!item.completed_at && item.status !== "declined" ? <form className={styles.form} onSubmit={(event) => void decide(event, item)}><label>Action<select name="action" defaultValue={item.owner_user_id ? "approve" : "assign"}><option value="assign">Assign to me</option><option value="approve">Approve / begin processing</option><option value="hold">Record valid hold</option><option value="decline">Decline with reason</option><option value="complete">Complete non-erasure request</option></select></label><label>Reason or outcome<input name="reason" minLength={10} maxLength={2000} required placeholder="Explain this accountable action" /></label><Button disabled={busy === item.id}>{busy === item.id ? "Saving…" : "Confirm action"}</Button></form> : null}</details></article>)}
      {requests.data && !requests.data.length ? <RequestState state="empty" title="No privacy requests">New student requests will appear here with a due date and status.</RequestState> : null}
    </section>
  </PageContainer>;
}
