"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarPlus, CheckCircle2, FileLock2, Scale, Undo2 } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { CorrectionPanel } from "@/features/experience/correction-panel";
import { ApiError, apiPath, apiRequest, csrfRequest } from "@/lib/api/client";
import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
} from "@/lib/idempotency";
import type { PlacementApplication } from "./types";
import styles from "./student-application-detail.module.css";

const formatDate = (value: string, timeZone: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone,
}).format(new Date(value));

const outcomeIsUnknown = (error: unknown) => error instanceof ApiError &&
  ["offline", "timeout", "dependency", "server"].includes(error.kind);

export function StudentApplicationDetail({ applicationId }: { applicationId: string }) {
  const [application, setApplication] = useState<PlacementApplication | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setApplication(await apiRequest<PlacementApplication>(`/applications/${applicationId}`, { cache: "no-store" }));
      setError("");
    } catch {
      setError("This application could not be refreshed. No application data was changed.");
    }
  }, [applicationId]);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("confirmation") !== "on") return;
    setBusy(true);
    setNotice("");
    try {
      setApplication(await csrfRequest<PlacementApplication>(`/applications/${applicationId}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ reason: form.get("reason"), confirmation: "WITHDRAW" }),
      }));
      setError("");
    } catch (caught) {
      if (outcomeIsUnknown(caught)) {
        await load();
        setError(
          "CampusHire could not confirm the withdrawal outcome. The application record was refreshed; retry only if it still shows withdrawal as available.",
        );
      } else {
        setError("Withdrawal was not completed. Check the permitted deadline and current status.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function appeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("confirmation") !== "on") return;
    const operationScope = `appeal:${applicationId}`;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await csrfRequest(`/applications/${applicationId}/appeals`, {
        method: "POST",
        headers: { "Idempotency-Key": getOrCreateIdempotencyKey(operationScope) },
        body: JSON.stringify({
          kind: form.get("kind"),
          reason: form.get("reason"),
          supporting_evidence: String(form.get("evidence") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
          confirmation: "SUBMIT APPEAL",
        }),
      });
      await load();
      clearIdempotencyKey(operationScope);
      formElement.reset();
      setNotice("Your review request was submitted with its supporting evidence.");
    } catch (caught) {
      if (outcomeIsUnknown(caught)) {
        setError(
          "CampusHire could not confirm the request outcome. Retry this form to safely reuse the same request, or refresh the application record first.",
        );
      } else if (
        caught instanceof ApiError &&
        (caught.code === "application_appeal_already_open" ||
          caught.message === "application_appeal_already_open")
      ) {
        clearIdempotencyKey(operationScope);
        await load();
        setNotice("An open review request already exists and is shown below.");
      } else {
        clearIdempotencyKey(operationScope);
        setError("The review request was not submitted. An existing open request may need a response first.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!application) return <main id="main-content" className={styles.page}><h1>Application record</h1>{error ? <Alert tone="error">{error} <button type="button" onClick={() => void load()}>Retry</button></Alert> : <p role="status">Loading your saved application details…</p>}</main>;

  const role = application.role_snapshot as { title?: string; company_name?: string; deadline_at?: string };
  const rule = application.rule_snapshot as {
    version?: number;
    policy_references?: Array<{ title?: string; version?: number }>;
  };
  const policyEvidence = rule.policy_references?.map((policy) =>
    `${policy.title ?? "Approved policy"} v${policy.version ?? "—"}`).join(", ");
  const openAppeal = application.appeals.find((item) => ["submitted", "under_review"].includes(item.status));
  const canRequestReview = !openAppeal && application.status !== "withdrawn";
  const hasActions = application.can_withdraw || canRequestReview;
  return <main id="main-content" className={styles.page}>
    <Link className={styles.back} href="/applications"><Undo2 aria-hidden="true" /> All applications</Link>
    <header><div><p>{role.company_name ?? "Published opportunity"}</p><h1>{role.title ?? "Application record"}</h1><span>Submitted {formatDate(application.created_at, application.institution_timezone)} · {application.institution_timezone}</span></div><strong>{application.status.replaceAll("_", " ")}</strong></header>
    {error ? <Alert tone="warning">{error}</Alert> : null}
    {notice ? <Alert tone="success">{notice}</Alert> : null}
    <section className={styles.history} aria-label="Current application step"><h2>What happens next</h2><p>{application.next_step ?? `Recorded stage: ${application.status.replaceAll("_", " ")}.`}</p><p>Responsible party: {application.next_actor === "student" ? "You" : application.next_actor === "placement_team" ? "T&P" : "As recorded in the current stage"} · Last change {formatDate(application.updated_at, application.institution_timezone)}</p></section>
    <CorrectionPanel key={application.id} applicationId={application.id} timezone={application.institution_timezone} closed={["offered", "rejected", "withdrawn"].includes(application.status)} onChange={() => void load()} />
    <section className={styles.summary} aria-label="Locked application details">
      <article><FileLock2 aria-hidden="true" /><p>Locked resume</p><h2>Version {String(application.resume_snapshot.version_number ?? "—")}</h2><span>{String(application.resume_snapshot.original_name ?? "Reviewed resume")}</span></article>
      <article><Scale aria-hidden="true" /><p>Decision version</p><h2>Rule v{String(rule.version ?? "—")}</h2><span>{policyEvidence ? `${policyEvidence} · ` : ""}{String(application.decision_snapshot.eligibility_fingerprint ?? "").slice(0, 12)} · eligibility record</span></article>
      <article><CalendarPlus aria-hidden="true" /><p>Application deadline</p><h2>{role.deadline_at ? formatDate(role.deadline_at, application.institution_timezone) : "Not available"}</h2>{role.deadline_at ? <a href={apiPath(`/applications/${application.id}/deadline.ics`)} download>Download calendar file</a> : null}</article>
    </section>
    <section className={styles.history} aria-labelledby="history-title"><header><p>Status history</p><h2 id="history-title">A complete, append-only timeline</h2></header><ol>{application.history.map((event) => <li key={event.id}><CheckCircle2 aria-hidden="true" /><div><strong>{event.to_status.replaceAll("_", " ")}</strong><time dateTime={event.created_at}>{formatDate(event.created_at, application.institution_timezone)}</time>{event.reason ? <p>{event.reason}</p> : null}</div></li>)}</ol></section>
    {application.appeals.length ? <section className={styles.appeals} aria-labelledby="appeals-title"><h2 id="appeals-title">Review requests</h2>{application.appeals.map((item) => <article key={item.id}><strong>{item.kind.replaceAll("_", " ")} · {item.status.replaceAll("_", " ")}</strong><p>{item.reason}</p>{item.supporting_evidence.length ? <><h3>Supporting evidence</h3><ul>{item.supporting_evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul></> : null}{item.administrator_response ? <blockquote>{item.administrator_response}</blockquote> : <span>Awaiting an administrator response.</span>}</article>)}</section> : null}
    {hasActions ? <section className={styles.actions} aria-label="Application actions">
      {application.can_withdraw ? <details><summary>Withdraw application</summary><form onSubmit={withdraw}><label>Reason<textarea name="reason" required minLength={10} maxLength={500} /></label><label className={styles.confirm}><input name="confirmation" type="checkbox" required /> I understand this withdrawal is final for this role.</label><button disabled={busy} type="submit">Confirm withdrawal</button></form></details> : null}
      {canRequestReview ? <details><summary>Request an appeal or manual review</summary><form onSubmit={appeal}><label>Request type<select name="kind"><option value="manual_review">Manual information review</option><option value="appeal">Decision appeal</option></select></label><label>Reason<textarea name="reason" required minLength={20} maxLength={1000} /></label><label>Supporting details (optional)<input name="evidence" placeholder="Education record, reviewed resume" /></label><label className={styles.confirm}><input name="confirmation" type="checkbox" required /> I confirm this request is accurate and ready for review.</label><button disabled={busy} type="submit">Submit review request</button></form></details> : null}
    </section> : null}
  </main>;
}
