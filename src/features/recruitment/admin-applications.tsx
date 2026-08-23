"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileLock2,
  History,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form-controls";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import type { AdminApplicationPage, PlacementApplication } from "./types";
import styles from "./admin-applications.module.css";

const statuses = ["all", "submitted", "under_review", "shortlisted", "interview", "offered", "rejected"];

function roleName(application: PlacementApplication) {
  return String(application.role_snapshot.title ?? "Placement role");
}

function companyName(application: PlacementApplication) {
  return String(application.role_snapshot.company_name ?? "Company");
}

export function AdminApplications() {
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try {
      const data = await apiRequest<AdminApplicationPage | PlacementApplication[]>(
        "/admin/recruitment/applications?page=1&page_size=50",
        { cache: "no-store" },
      );
      // Support the former list shape during a staggered frontend/backend deploy.
      const items = Array.isArray(data) ? data : data.items;
      setApplications(items);
      setSelectedId((current) =>
        items.some((item) => item.id === current) ? current : items[0]?.id || "",
      );
    } catch { setError("Applications could not be loaded. No candidate decision was changed."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const visible = useMemo(() => filter === "all" ? applications : applications.filter((item) => item.status === filter), [applications, filter]);
  const selected = applications.find((item) => item.id === selectedId) ?? visible[0];

  async function changeStatus(status: string) {
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const updated = await csrfRequest<PlacementApplication>(`/admin/recruitment/applications/${selected.id}/status`, { method: "POST", body: JSON.stringify({ status, reason: "Reviewed by the placement cell" }) });
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item)); setNotice(`Application moved to ${status.replaceAll("_", " ")}.`);
    } catch { setError("The status transition was rejected. Follow the documented sequence or record an authorized override."); }
    finally { setBusy(false); }
  }

  async function override(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const updated = await csrfRequest<PlacementApplication>(`/admin/recruitment/applications/${selected.id}/override`, { method: "POST", body: JSON.stringify({ status: data.get("status"), reason: data.get("reason"), policy_reference: data.get("policy_reference") || null }) });
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item)); setNotice("Override recorded with actor, reason, policy reference, and immutable status history."); event.currentTarget.reset();
    } catch { setError("The override was not recorded. Provide a reason of at least 10 characters and a supported target state."); }
    finally { setBusy(false); }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}><div><p>Accountable review</p><h1>Applications</h1><span>Eligibility evidence, immutable snapshots, and human decisions remain visibly separate.</span></div><button type="button" onClick={() => void load()}><RefreshCcw aria-hidden="true" />Refresh</button></header>
      {error && <Alert tone="error">{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}
      <nav className={styles.filters} aria-label="Application status filters">{statuses.map((status) => <button type="button" key={status} aria-current={filter === status ? "page" : undefined} onClick={() => setFilter(status)}>{status.replaceAll("_", " ")}<span>{status === "all" ? applications.length : applications.filter((item) => item.status === status).length}</span></button>)}</nav>

      <div className={styles.workspace} aria-busy={loading}>
        <section className={styles.queue} aria-labelledby="application-queue"><div className={styles.sectionHeader}><h2 id="application-queue">Candidate queue</h2><span>{visible.length} records</span></div>{loading ? <p>Loading application records…</p> : null}{!loading && !visible.length ? <EmptyState title="No applications in this view"><span>Choose another status or wait for a student submission.</span></EmptyState> : null}<div>{visible.map((application) => <button type="button" key={application.id} className={application.id === selected?.id ? styles.selected : ""} onClick={() => setSelectedId(application.id)}><span className={styles.avatar} aria-hidden="true">{application.student_user_id.slice(0, 2).toUpperCase()}</span><span><strong>{roleName(application)}</strong><small>{companyName(application)} · {new Date(application.created_at).toLocaleDateString()}</small></span><Badge tone={application.status === "shortlisted" || application.status === "offered" ? "success" : application.status === "rejected" ? "warning" : "neutral"}>{application.status.replaceAll("_", " ")}</Badge><ArrowRight aria-hidden="true" /></button>)}</div></section>

        <section className={styles.inspector} aria-label="Candidate decision evidence">
          {!selected ? <EmptyState title="Select an application"><span>Its immutable decision inputs and status history will appear here.</span></EmptyState> : <>
            <header><div><p>{companyName(selected)}</p><h2>{roleName(selected)}</h2><span>{selected.student_name ?? selected.student_user_id.slice(0, 8)} · {selected.student_email ?? "email unavailable"} · submitted {new Date(selected.created_at).toLocaleString()}</span></div><Badge tone={selected.status === "shortlisted" || selected.status === "offered" ? "success" : "neutral"}>{selected.status.replaceAll("_", " ")}</Badge></header>
            <div className={styles.snapshotGrid}><article><FileLock2 aria-hidden="true" /><div><strong>Resume snapshot</strong><p>Version {String(selected.resume_snapshot.version_number ?? "—")} · {String(selected.resume_snapshot.original_name ?? "reviewed PDF")}</p><code>{String(selected.resume_snapshot.checksum ?? "").slice(0, 14)}…</code></div></article><article><ShieldCheck aria-hidden="true" /><div><strong>Eligibility version</strong><p>Rule v{String(selected.rule_snapshot.version ?? "—")}</p><code>{String(selected.rule_snapshot.id ?? "").slice(0, 14)}…</code></div></article></div>
            <section className={styles.evidence}><div className={styles.sectionHeader}><h3>Rule-by-rule evidence</h3><Badge tone={selected.eligibility_snapshot.status === "eligible" ? "success" : "warning"}>{selected.eligibility_snapshot.status.replaceAll("_", " ")}</Badge></div><ul>{selected.eligibility_snapshot.results.map((result) => <li key={result.label}>{result.passed === true ? <CheckCircle2 className={styles.pass} aria-hidden="true" /> : <CircleAlert className={styles.review} aria-hidden="true" />}<div><strong>{result.label}</strong><p>{result.reason}</p></div></li>)}</ul></section>
            <section className={styles.actions}><div className={styles.sectionHeader}><h3>Decision actions</h3><span>Validated sequence</span></div><div>{selected.status === "submitted" ? <button disabled={busy} type="button" onClick={() => void changeStatus("under_review")}>Start review</button> : null}{selected.status === "under_review" ? <><button disabled={busy} type="button" onClick={() => void changeStatus("shortlisted")}>Shortlist</button><button disabled={busy} type="button" onClick={() => void changeStatus("rejected")}>Reject</button></> : null}{selected.status === "shortlisted" ? <button disabled={busy} type="button" onClick={() => void changeStatus("interview")}>Move to interview</button> : null}{selected.status === "interview" ? <><button disabled={busy} type="button" onClick={() => void changeStatus("offered")}>Record offer</button><button disabled={busy} type="button" onClick={() => void changeStatus("rejected")}>Reject</button></> : null}</div></section>
            <details className={styles.override}><summary>Authorized override</summary><form onSubmit={override}><Alert tone="warning">Use only when policy allows an exception. The reason becomes an immutable audit record.</Alert><Select id="override-status" name="status" label="Override decision"><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option></Select><label><span>Reason</span><textarea name="reason" required minLength={10} maxLength={500} rows={3} /></label><label><span>Policy reference (optional)</span><input name="policy_reference" maxLength={300} /></label><button type="submit" disabled={busy}>Record override</button></form></details>
            <section className={styles.timeline}><div className={styles.sectionHeader}><h3><History aria-hidden="true" />Status history</h3><span>Append-only</span></div><ol>{selected.history.map((event) => <li key={event.id}><Clock3 aria-hidden="true" /><div><strong>{event.to_status.replaceAll("_", " ")}</strong><p>{event.reason || "No additional reason recorded"}</p><small>{new Date(event.created_at).toLocaleString()} · actor {event.actor_user_id.slice(0, 8)}</small></div></li>)}</ol></section>
          </>}
        </section>
      </div>
    </main>
  );
}
