"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, History } from "lucide-react";

import { Alert, Badge } from "@/components/ui/feedback";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./outcome-timeline.module.css";

export type OutcomeEvent = {
  id: string;
  event_type: string;
  outcome_state: "provisional" | "verified";
  event_at: string;
  source_type: string;
  evidence_reference: string | null;
  verified_at: string | null;
  joining_date: string | null;
  joining_location: string | null;
  next_update_owner: string | null;
  next_update_due_at: string | null;
  supersedes_event_id: string | null;
  superseded_by_event_id: string | null;
  correction_reason: string | null;
};

const eventLabels: Record<string, string> = {
  selection: "Selected",
  offer_issued: "Offer issued",
  offer_accepted: "Offer accepted",
  offer_declined: "Offer declined",
  offer_rescinded: "Offer rescinded",
  joining_deferred: "Joining deferred",
  joining: "Joined",
  no_show: "Did not join",
  placement_confirmed: "Placement confirmed",
  internship: "Internship recorded",
  ppo: "PPO recorded",
  higher_studies: "Higher studies recorded",
  approved_off_campus: "Approved off-campus outcome",
};

const eventTypes = Object.entries(eventLabels);
const readable = (value: string) => value.replaceAll("_", " ");

export function OutcomeTimeline({
  applicationId,
  endpoint,
  timeZone,
  canRecord = false,
}: {
  applicationId: string;
  endpoint: string;
  timeZone: string;
  canRecord?: boolean;
}) {
  const [events, setEvents] = useState<OutcomeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest<OutcomeEvent[]>(endpoint, { cache: "no-store" });
      setEvents(Array.isArray(result) ? result : []);
      setError("");
    } catch {
      setError("The placement outcome timeline is temporarily unavailable. Application status is unaffected.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const state = String(data.get("outcome_state"));
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await csrfRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          event_type: data.get("event_type"),
          outcome_state: state,
          event_at: new Date(String(data.get("event_at"))).toISOString(),
          source_type: data.get("source_type"),
          evidence_reference: state === "verified" ? data.get("evidence_reference") : null,
          joining_date: data.get("joining_date") || null,
          joining_location: data.get("joining_location") || null,
          next_update_owner: data.get("next_update_owner") || null,
          next_update_due_at: data.get("next_update_due_at")
            ? new Date(String(data.get("next_update_due_at"))).toISOString()
            : null,
        }),
      });
      form.reset();
      setNotice("Outcome event recorded. Records already on file were not changed.");
      await load();
    } catch {
      setError("The outcome was not recorded. Check the supporting record and current application before trying again.");
    } finally {
      setBusy(false);
    }
  }

  return <section className={styles.section} aria-labelledby={`outcome-title-${applicationId}`}>
    <header><div><p>Recorded placement progress</p><h2 id={`outcome-title-${applicationId}`}>Placement outcome timeline</h2></div><Badge tone="neutral">{events.length} events</Badge></header>
    <p className={styles.explainer}>Application stages and placement outcomes are separate. An offer does not confirm that you joined.</p>
    {error ? <Alert tone="warning">{error} <button type="button" onClick={() => void load()}>Retry</button></Alert> : null}
    {notice ? <Alert tone="success">{notice}</Alert> : null}
    {loading ? <p role="status">Loading recorded outcomes…</p> : events.length ? <ol className={styles.timeline}>{events.map(item => <li key={item.id} data-superseded={!!item.superseded_by_event_id}>
      <span className={styles.icon}>{item.outcome_state === "verified" ? <CheckCircle2 aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span>
      <div><div className={styles.title}><strong>{eventLabels[item.event_type] ?? readable(item.event_type)}</strong><Badge tone={item.outcome_state === "verified" ? "success" : "warning"}>{item.outcome_state}</Badge>{item.superseded_by_event_id ? <Badge tone="neutral">superseded</Badge> : null}</div>
        <time dateTime={item.event_at}>{new Date(item.event_at).toLocaleString(undefined, { timeZone })}</time>
        <p>Source: {readable(item.source_type)}{item.evidence_reference ? " · Supporting record on file" : ""}</p>
        {item.joining_date || item.joining_location ? <p>Joining: {item.joining_date ?? "date pending"}{item.joining_location ? ` · ${item.joining_location}` : ""}</p> : null}
        {item.next_update_owner ? <p>Next update: {item.next_update_owner}{item.next_update_due_at ? ` by ${new Date(item.next_update_due_at).toLocaleString(undefined, { timeZone })}` : ""}</p> : null}
        {item.correction_reason ? <p>Correction: {item.correction_reason}</p> : null}
      </div>
    </li>)}</ol> : <div className={styles.empty}><History aria-hidden="true" /><p>No placement outcome has been recorded yet.</p></div>}
    {canRecord ? <details className={styles.record}><summary>Record placement outcome</summary><form onSubmit={record}>
      <label>Outcome<select name="event_type" required>{eventTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Outcome status<select name="outcome_state" required defaultValue="provisional"><option value="provisional">Provisional</option><option value="verified">Verified (source record required)</option></select></label>
      <label>Event time<input name="event_at" type="datetime-local" required /></label>
      <label>Source type<input name="source_type" required minLength={2} maxLength={48} placeholder="Employer confirmation" /></label>
      <label>Supporting record link<input name="evidence_reference" maxLength={500} placeholder="Needed to mark this outcome verified" /></label>
      <label>Joining date<input name="joining_date" type="date" /></label>
      <label>Joining location<input name="joining_location" maxLength={200} /></label>
      <label>Next update owner<input name="next_update_owner" maxLength={160} /></label>
      <label>Next update due<input name="next_update_due_at" type="datetime-local" /></label>
      <button disabled={busy}>{busy ? "Recording…" : "Record append-only event"}</button>
    </form></details> : null}
  </section>;
}
