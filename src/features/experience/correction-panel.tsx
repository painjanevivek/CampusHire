"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Alert, Badge } from "@/components/ui/feedback";
import { apiPath, apiRequest, csrfRequest, ApiError } from "@/lib/api/client";
import type { ResumeChoice } from "@/features/recruitment/types";
import styles from "./experience.module.css";

export type CorrectionRequest = {
  id: string; instructions: string; deadline_at: string | null; overdue?: boolean; status: string; revision: number;
  events: Array<{ id: string; actor_user_id?: string; action: string; body: string; resume_version_id: string | null; created_at: string }>;
};

export function CorrectionPanel({ applicationId, admin = false, closed = false, onChange, timezone = "UTC" }: {
  applicationId: string; admin?: boolean; closed?: boolean; onChange?: () => void; timezone?: string;
}) {
  const [items, setItems] = useState<CorrectionRequest[]>([]);
  const [resumes, setResumes] = useState<ResumeChoice[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const path = `${admin ? "/admin/recruitment" : ""}/applications/${applicationId}/requests`;
  const load = useCallback(async () => {
    try { setItems(await apiRequest<CorrectionRequest[]>(path, { cache: "no-store" })); setError(""); }
    catch { setError("Information requests could not be loaded. Refresh to try again."); }
  }, [path]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => {
    if (admin) return;
    let active = true;
    void apiRequest<ResumeChoice[]>("/resumes").then(data => {
      if (active) setResumes(data.filter(r => r.status === "completed" && r.scan_status === "clean"));
    }).catch(() => { /* Text responses remain available when the resume list is unavailable. */ });
    return () => { active = false; };
  }, [admin]);
  async function submit(event: FormEvent<HTMLFormElement>, request?: CorrectionRequest) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(""); setNotice("");
    const endpoint = request ? `${path}/${request.id}/${admin ? "resolve" : "response"}` : path;
    const body = request ? {
      expected_revision: request.revision, body: String(data.get("body")),
      ...(admin ? { action: data.get("action") } : { resume_version_id: data.get("resume") || null }),
    } : { instructions: data.get("instructions"), deadline_at: data.get("deadline") ? new Date(String(data.get("deadline"))).toISOString() : null };
    try {
      await csrfRequest(endpoint, { method: "POST", body: JSON.stringify(body) });
      form.reset(); await load(); onChange?.(); setNotice(request ? "Request updated." : "Information request sent.");
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 409
        ? "This request changed. Refresh the requests and review the latest response before trying again."
        : "The request could not be saved. Your entered text is still available.");
    } finally { setBusy(false); }
  }
  const date = (value: string) => new Date(value).toLocaleString(undefined, { timeZone: timezone });
  return <section className={styles.panel} aria-label="Information requests">
    <h2>Information requests</h2>
    <p>Responses are added to this application. The original submission stays unchanged.</p>
    {error && <Alert tone="error">{error} <button className={styles.button} onClick={() => void load()}>Refresh requests</button></Alert>}
    {notice && <p role="status">{notice}</p>}
    {!items.length && !error && <p>No additional information has been requested.</p>}
    <div className={styles.stack}>{items.map(item => <article id={`request-${item.id}`} key={item.id}>
      <Badge tone={item.status === "open" ? "warning" : item.status === "resolved" ? "success" : "neutral"}>{item.status.replaceAll("_", " ")}</Badge>
      <p>{item.instructions}</p>
      {item.deadline_at && <p className={styles.muted}>{item.overdue ? "Overdue · " : "Due "}{date(item.deadline_at)} ({timezone})</p>}
      <details><summary>Request history ({item.events.length})</summary><ol className={styles.timeline}>{item.events.map(entry => <li key={entry.id}>
        <span>{entry.action}</span> · <time dateTime={entry.created_at}>{date(entry.created_at)}</time>
        <p>{entry.body}</p>{entry.actor_user_id && <p className={styles.muted}>Actor: <code>{entry.actor_user_id}</code></p>}{entry.resume_version_id && <p className={styles.muted}><a href={apiPath(admin ? `${path}/${item.id}/events/${entry.id}/resume` : `/resumes/${entry.resume_version_id}/download`)} download>Download attached reviewed resume</a></p>}
      </li>)}</ol></details>
      {!closed && ((admin && ["open", "awaiting_review"].includes(item.status)) || (!admin && item.status === "open")) &&
        <form className={styles.form} onSubmit={event => void submit(event, item)}>
          <label>{admin ? "Review explanation" : "Your response"}<textarea name="body" required minLength={10} maxLength={admin ? 2000 : 4000} /></label>
          {admin ? <label>Request action<select name="action" defaultValue={item.status === "awaiting_review" ? "resolve" : "cancel"}>
            {item.status === "awaiting_review" && <><option value="resolve">Resolve request</option><option value="reopen">Request another response</option></>}
            <option value="cancel">Cancel request</option></select></label>
            : <label>Supporting reviewed resume (optional)<select name="resume"><option value="">No attachment</option>{resumes.map(r => <option key={r.id} value={r.id}>{r.original_name} · v{r.version_number}</option>)}</select></label>}
          <button className={styles.primary} disabled={busy}>{admin ? "Save request decision" : "Send response for review"}</button>
        </form>}
    </article>)}</div>
    {admin && !closed && <details><summary>Request additional information</summary><form className={styles.form} onSubmit={event => void submit(event)}>
      <label>What does the student need to provide?<textarea name="instructions" required minLength={10} maxLength={2000} /></label>
      <label>Response deadline (optional, your local time)<input type="datetime-local" name="deadline" /></label>
      <button className={styles.primary} disabled={busy}>Send information request</button>
    </form></details>}
  </section>;
}
