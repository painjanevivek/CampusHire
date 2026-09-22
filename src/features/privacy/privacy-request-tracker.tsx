"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { useResource } from "@/features/experience/use-resource";
import { ApiError, csrfRequest } from "@/lib/api/client";
import styles from "@/features/profile/profile-workspace.module.css";

type PrivacyRequest = {
  id: string;
  request_type: "export" | "correction" | "erasure" | "consent_withdrawal" | "grievance";
  status: string;
  details: string;
  owner_user_id: string | null;
  due_at: string | null;
  result_summary: string | null;
  resolution_effect: string | null;
  processing_receipt: Record<string, unknown>;
  cleanup_request_id: string | null;
  receipt_reference: string;
  created_at: string;
  completed_at: string | null;
};

export function PrivacyRequestTracker() {
  const requests = useResource<PrivacyRequest[]>("/privacy/requests");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setMessage("");
    try {
      await csrfRequest("/privacy/requests", {
        method: "POST",
        body: JSON.stringify({ request_type: data.get("request_type"), details: data.get("details") }),
      });
      form.reset(); requests.refresh();
      setMessage("Request submitted. Its receipt remains available here while processing continues.");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The privacy request was not submitted.");
    } finally { setBusy(false); }
  }

  return <div className={styles.privacyRequests}>
    <p>Track export, correction, erasure, consent-withdrawal, or grievance requests. Completion is shown only after required processing finishes.</p>
    {message ? <Alert>{message}</Alert> : null}
    <form onSubmit={submit}>
      <label>Request type<select name="request_type" defaultValue="export"><option value="export">Export my data</option><option value="correction">Correct a record</option><option value="erasure">Erase eligible data</option><option value="consent_withdrawal">Withdraw optional consent</option><option value="grievance">Raise a grievance</option></select></label>
      <label>What should the placement team know?<textarea name="details" minLength={10} maxLength={2000} required /></label>
      <Button disabled={busy}>{busy ? "Submitting…" : "Submit request"}</Button>
    </form>
    {requests.loading ? <p role="status">Loading your privacy requests…</p> : null}
    {requests.error ? <RequestState state="error" title="Privacy requests are unavailable" onRetry={requests.refresh}>{requests.error}</RequestState> : null}
    {requests.data?.length ? <ol aria-label="Your privacy requests">{requests.data.map((request) => <li key={request.id}>
      <div><strong>{request.request_type.replaceAll("_", " ")}</strong><Badge tone={request.status === "completed" ? "success" : request.status === "failed" || request.status === "held" ? "warning" : "neutral"}>{request.status.replaceAll("_", " ")}</Badge></div>
      <p>{request.owner_user_id ? "Assigned to the responsible team" : "Awaiting assignment"} · {request.due_at ? `target ${new Date(request.due_at).toLocaleDateString()}` : "no target recorded"}</p>
      {request.result_summary ? <p>{request.result_summary}</p> : null}
      <details><summary>Receipt and request details</summary><p>{request.details}</p><code>{request.receipt_reference}</code>{request.resolution_effect ? <p>Resolution: {request.resolution_effect.replaceAll("_", " ")}</p> : null}<dl>{Object.entries(request.processing_receipt ?? {}).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{String(value).replaceAll("_", " ")}</dd></div>)}</dl></details>
    </li>)}</ol> : requests.data ? <p>No privacy requests submitted.</p> : null}
  </div>;
}
