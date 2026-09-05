"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Badge } from "@/components/ui/feedback";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import { CorrectionPanel } from "@/features/experience/correction-panel";
import type { PlacementApplication } from "./types";
import styles from "./admin-applications.module.css";
import ui from "@/features/experience/experience.module.css";

type QueueItem = { id: string; student_name: string; role_title: string; company_name: string; status: string; revision: number; open_requests: number; awaiting_review: number };
type Queue = { items: QueueItem[]; total: number; page: number };
type Preview = { items: Array<{ application_id: string; revision: number; allowed: boolean; explanation: string; current_status: string; target_status: string }>; allowed_count: number; blocked_count: number };
type BulkDraft = { application_ids: string[]; status: string; reason: string; expected_revisions: Record<string, number> };
const statuses = ["submitted", "under_review", "shortlisted", "interview", "offered", "rejected", "withdrawn"];

export function AdminApplications() {
  const router = useRouter();
  const { push, replace } = router;
  const params = useSearchParams();
  const query = new URLSearchParams(params.toString());
  query.delete("selected");
  const queryString = query.toString();
  const selectedId = params.get("selected") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [queue, setQueue] = useState<Queue>({ items: [], total: 0, page: 1 });
  const [detail, setDetail] = useState<PlacementApplication | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draft, setDraft] = useState<BulkDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const queueRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const detailId = selectedId || queue.items[0]?.id || "";
  const selected = detail?.id === detailId ? detail : null;
  const latestSelected = useRef(selectedId);
  useEffect(() => { latestSelected.current = selectedId; }, [selectedId]);

  const changeQuery = useCallback((changes: Record<string, string | null>, replaceHistory = false) => {
    const next = new URLSearchParams(window.location.search);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    (replaceHistory ? replace : push)(`/admin/applications${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [push, replace]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true); setError(""); setChecked([]); setPreview(null); setDraft(null);
      void apiRequest<Queue>(`/admin/recruitment/review-queue?${queryString}`, { signal: controller.signal, cache: "no-store" })
        .then(data => {
          if (controller.signal.aborted) return;
          setQueue(data);
          if (latestSelected.current && !data.items.some(item => item.id === latestSelected.current)) {
            changeQuery({ selected: data.items[0]?.id ?? null }, true);
          }
          const last = Math.max(1, Math.ceil(data.total / 25));
          if (page > last) changeQuery({ page: String(last), selected: null }, true);
        }).catch(() => { if (!controller.signal.aborted) setError("The candidate queue could not be refreshed. Your last loaded records remain visible."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [queryString, refresh, changeQuery, page]);

  useEffect(() => {
    if (!detailId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setDetailLoading(true);
      void apiRequest<PlacementApplication>(`/admin/recruitment/review-queue/${detailId}`, { signal: controller.signal, cache: "no-store" })
        .then(value => { if (controller.signal.aborted) return; setDetail(value); if (selectedId) requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true })); })
        .catch(() => { if (!controller.signal.aborted) setError("Candidate details could not be refreshed. Refresh before making a decision."); })
        .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [detailId, selectedId, refresh]);

  function fail(cause: unknown) {
    setError(cause instanceof ApiError && cause.status === 409
      ? "This record or preview changed. Refresh and review the latest evidence before retrying. No silent override was made."
      : "The change could not be confirmed. Refresh the recorded state before retrying; your entered explanation is preserved.");
  }
  async function review(event: FormEvent<HTMLFormElement>, override = false) {
    event.preventDefault();
    if (!selected || detailLoading) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(""); setNotice("");
    try {
      await csrfRequest(`/admin/recruitment/applications/${selected.id}/${override ? "override" : "status"}`, {
        method: "POST", body: JSON.stringify({ status: data.get("status"), reason: data.get("reason"),
          expected_revision: selected.revision, ...(override ? { policy_reference: data.get("policy_reference") } : {}) }),
      });
      form.reset(); setNotice(override ? "Authorized override recorded with its policy reference." : "Decision and constructive feedback recorded.");
      setRefresh(value => value + 1);
    } catch (cause) { fail(cause); } finally { setBusy(false); }
  }
  async function feedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = event.currentTarget; const data = new FormData(form);
    setBusy(true); setError("");
    try {
      await csrfRequest("/admin/notifications", { method: "POST", body: JSON.stringify({
        recipient_user_id: selected.student_user_id, event_key: `feedback:${selected.id}:${selected.status}`,
        title: data.get("title"), body: data.get("body"), deep_link: `/applications/${selected.id}`,
      }) });
      form.reset(); setNotice("Student update published.");
    } catch (cause) { fail(cause); } finally { setBusy(false); }
  }
  async function bulk(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setBusy(true); setError("");
    try {
      if (event) {
        const data = new FormData(event.currentTarget);
        const next = { application_ids: checked, status: String(data.get("status")), reason: String(data.get("reason")),
          expected_revisions: Object.fromEntries(queue.items.filter(item => checked.includes(item.id)).map(item => [item.id, item.revision])) };
        setPreview(await csrfRequest<Preview>("/admin/recruitment/applications/bulk/preview", { method: "POST", body: JSON.stringify(next) }));
        setDraft(next);
      } else if (preview && draft && !preview.blocked_count) {
        const result = await csrfRequest<{ updated_count: number }>("/admin/recruitment/applications/bulk/status", {
          method: "POST", body: JSON.stringify({ ...draft,
            expected_revisions: Object.fromEntries(preview.items.map(item => [item.application_id, item.revision])),
            confirmation: "APPLY BULK STATUS" }),
        });
        setNotice(`${result.updated_count} applications updated.`); setRefresh(value => value + 1);
      }
    } catch (cause) { fail(cause); } finally { setBusy(false); }
  }
  function filters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    changeQuery({ q: String(data.get("q") ?? ""), application_status: String(data.get("status") ?? ""),
      requests: String(data.get("requests") ?? ""), page: null, selected: null });
  }

  return <main id="main-content" className={styles.page} data-navigation-ready={!loading && !detailLoading && (!detailId || !!selected) && !error}>
    <header className={styles.header}><div><p>Accountable review</p><h1>Applications</h1><span>Review evidence, ask for clarification, and record a reasoned decision.</span></div>
      <button onClick={() => setRefresh(value => value + 1)} disabled={busy}>Refresh</button></header>
    {error && <Alert tone="error">{error}</Alert>}{notice && <p role="status">{notice}</p>}
    <form key={queryString} className={ui.toolbar} onSubmit={filters} aria-label="Candidate filters">
      <label>Candidate search<input name="q" defaultValue={params.get("q") ?? ""} placeholder="Name or email" /></label>
      <label>Status<select name="status" defaultValue={params.get("application_status") ?? ""}><option value="">All statuses</option>{statuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
      <label>Information requests<select name="requests" defaultValue={params.get("requests") ?? ""}><option value="">All requests</option><option value="open">Awaiting student</option><option value="overdue">Overdue</option><option value="awaiting_review">Response to review</option></select></label>
      <button className={ui.button}>Apply filters</button>
      <button className={ui.button} type="button" onClick={() => router.push("/admin/applications")}>Clear filters</button>
    </form>
    {checked.length > 0 && <section className={ui.panel} aria-label="Selection toolbar"><h2>{checked.length} selected on this page</h2>
      <form className={ui.form} onSubmit={event => void bulk(event)}>
        <label>Target status<select name="status">{statuses.filter(status => !["submitted", "withdrawn"].includes(status)).map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
        <label>Constructive feedback<textarea name="reason" minLength={10} maxLength={500} required /></label>
        <button className={ui.button} disabled={busy}>Preview changes</button>
      </form>
      {preview && <div aria-label="Bulk action preview"><p>{preview.allowed_count} allowed · {preview.blocked_count} blocked. Nothing applied yet.</p>
        <ul>{preview.items.map(item => <li key={item.application_id}>{queue.items.find(row => row.id === item.application_id)?.student_name}: {item.explanation}</li>)}</ul>
        <button className={ui.primary} disabled={busy || !!preview.blocked_count} onClick={() => void bulk()}>Confirm and notify students</button></div>}
    </section>}
    <div className={styles.workspace} data-detail-open={!!selectedId}>
      <section className={styles.queue} aria-label="Candidate queue" aria-busy={loading}>
        <h2>Candidate queue</h2><p>{queue.total} records</p>{loading && <p role="status">Refreshing results…</p>}
        {!loading && !queue.items.length && <p>No applications in this view.</p>}
        <div ref={queueRef} className={styles.queueList}>{queue.items.map(item => <div key={item.id} className={styles.queueRow}>
          <label className={styles.rowCheck}><input type="checkbox" aria-label={`Select ${item.student_name} for bulk review`} checked={checked.includes(item.id)}
            onChange={event => { setChecked(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id)); setPreview(null); setDraft(null); }} /></label>
          <button data-application-id={item.id} className={item.id === detailId ? styles.selected : ""} aria-pressed={item.id === detailId} onClick={() => changeQuery({ selected: item.id })}>
            <span><strong>{item.student_name}</strong><small>{item.role_title} · {item.company_name}</small><small>{item.status.replaceAll("_", " ")} · {item.open_requests} awaiting student · {item.awaiting_review} responses</small></span>
          </button></div>)}</div>
        <nav className={styles.pagination} aria-label="Application pages"><button disabled={loading || page === 1} onClick={() => changeQuery({ page: String(page - 1), selected: null })}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(queue.total / 25))}</span><button disabled={loading || page * 25 >= queue.total} onClick={() => changeQuery({ page: String(page + 1), selected: null })}>Next</button></nav>
      </section>
      <section data-selected-application={!detailLoading ? selected?.id : undefined} className={styles.inspector} aria-label="Candidate decision details" aria-busy={detailLoading}>
        <button className={styles.backToResults} onClick={() => { changeQuery({ selected: null }); requestAnimationFrame(() => queueRef.current?.querySelector<HTMLButtonElement>("button")?.focus()); }}>Back to results</button>
        {detailLoading && <p role="status">Loading candidate evidence…</p>}
        {selected ? <div className={ui.stack}>
          <header><h2 tabIndex={-1} ref={headingRef}>{selected.student_name}</h2><p>{String(selected.role_snapshot.title)} · {String(selected.role_snapshot.company_name)}</p>
            <Badge tone="neutral">{selected.status.replaceAll("_", " ")}</Badge><p>{selected.next_step}</p><p>Last change {new Date(selected.updated_at).toLocaleString(undefined, { timeZone: selected.institution_timezone })} ({selected.institution_timezone})</p>{!!selected.allowed_actions?.length && <a className={ui.button} href="#review-decision">Go to review decision</a>}</header>
          <section className={ui.panel}><h3>Eligibility evidence</h3><p>{selected.eligibility_snapshot.status.replaceAll("_", " ")}</p>
            <ul>{selected.eligibility_snapshot.results.map(result => <li key={result.label}>{result.label}: {result.reason}</li>)}</ul>
            <details><summary>Technical decision evidence</summary><pre className={ui.tableWrap}>{JSON.stringify({ rules: selected.rule_snapshot, decision: selected.decision_snapshot }, null, 2)}</pre></details>
          </section>
          <section className={ui.panel}><h3>Submitted resume</h3><p>{String(selected.resume_snapshot.original_name ?? "Reviewed resume")} · version {String(selected.resume_snapshot.version_number ?? "Not recorded")}</p>
            <details><summary>Immutable resume and profile evidence</summary><pre className={ui.tableWrap}>{JSON.stringify({ resume: selected.resume_snapshot, profile: selected.profile_snapshot }, null, 2)}</pre></details></section>
          <CorrectionPanel key={selected.id} applicationId={selected.id} admin timezone={selected.institution_timezone} closed={["offered", "rejected", "withdrawn"].includes(selected.status)} onChange={() => setRefresh(value => value + 1)} />
          <section className={ui.panel}><h3>Decision history</h3><ol className={ui.timeline}>{selected.history.map(item => <li key={item.id}><p>{item.to_status.replaceAll("_", " ")} · {new Date(item.created_at).toLocaleString()}</p><p>{item.reason ?? "No additional reason recorded"}</p><details><summary>Actor evidence</summary><code>{item.actor_user_id}</code></details></li>)}</ol></section>
          {!!selected.allowed_actions?.length && <form id="review-decision" className={ui.form} key={`${selected.id}:${selected.revision}`} onSubmit={event => void review(event)}>
            <h3>Record review decision</h3><label>Next recorded stage<select name="status" defaultValue="" required><option value="" disabled>Choose a decision</option>{selected.allowed_actions.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
            <label>Decision explanation and useful next step<textarea name="reason" required minLength={10} maxLength={500} /></label><button className={ui.primary} disabled={busy || detailLoading}>Save decision</button>
          </form>}
          <details><summary>Publish student feedback</summary><form className={ui.form} onSubmit={event => void feedback(event)}>
            <label>Update title<input name="title" required minLength={3} maxLength={180} /></label><label>Constructive feedback<textarea name="body" required minLength={3} maxLength={2000} /></label><button className={ui.button} disabled={busy}>Publish update</button>
          </form></details>
          <details><summary>Authorized override</summary><p>Only permitted officers may override. A policy reference and reason are required; the server validates your authority.</p>
            <form className={ui.form} onSubmit={event => void review(event, true)}><label>Override decision<select name="status"><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option></select></label>
              <label>Reason<textarea name="reason" minLength={10} maxLength={500} required /></label><label>Policy reference<input name="policy_reference" minLength={3} maxLength={300} required /></label><button className={ui.button} disabled={busy || detailLoading}>Record override</button>
            </form></details>
        </div> : !detailLoading && <p>Select an application to review its evidence.</p>}
      </section>
    </div>
  </main>;
}
