"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
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

const statuses = [
  "all",
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "offered",
  "rejected",
];

function roleName(application: PlacementApplication) {
  return String(application.role_snapshot.title ?? "Placement role");
}

function companyName(application: PlacementApplication) {
  return String(application.role_snapshot.company_name ?? "Company");
}

type BulkPreview = {
  items: Array<{ application_id: string; current_status: string; target_status: string; allowed: boolean; explanation: string }>;
  allowed_count: number;
  blocked_count: number;
};

type BulkDraft = { application_ids: string[]; status: string; reason: string };
const pageSize = 25;

export function AdminApplications() {
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [bulkPreview, setBulkPreview] = useState<BulkPreview | null>(null);
  const [bulkDraft, setBulkDraft] = useState<BulkDraft | null>(null);

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (filter !== "all") params.set("application_status", filter);
      const data = await apiRequest<AdminApplicationPage>(
        `/admin/recruitment/applications?${params.toString()}`, {
        cache: "no-store",
      });
      const items = data.items;
      setApplications(items);
      setTotal(data.total);
      const lastPage = Math.max(1, Math.ceil(data.total / pageSize));
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }
      setSelectedId((current) =>
        items.some((item) => item.id === current)
          ? current
          : items[0]?.id || "",
      );
    } catch {
      setError(
        "Applications could not be loaded. No candidate decision was changed.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter, page]);
  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const visible = applications;
  const selected =
    applications.find((item) => item.id === selectedId) ?? visible[0];

  async function changeStatus(status: string) {
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await csrfRequest<PlacementApplication>(
        `/admin/recruitment/applications/${selected.id}/status`,
        {
          method: "POST",
          body: JSON.stringify({
            status,
            reason: "Reviewed by the placement cell",
          }),
        },
      );
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(`Application moved to ${status.replaceAll("_", " ")}.`);
      await load();
    } catch {
      setError(
        "The status transition was rejected. Follow the documented sequence or record an authorized override.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function override(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      const updated = await csrfRequest<PlacementApplication>(
        `/admin/recruitment/applications/${selected.id}/override`,
        {
          method: "POST",
          body: JSON.stringify({
            status: data.get("status"),
            reason: data.get("reason"),
            policy_reference: data.get("policy_reference"),
          }),
        },
      );
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice(
        "Override saved with the administrator, reason, policy reference, and locked status history.",
      );
      event.currentTarget.reset();
      await load();
    } catch {
      setError(
        "The override was not recorded. Reauthenticate, then provide an accountable reason and policy reference.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData(event.currentTarget);
    try {
      await csrfRequest("/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          recipient_user_id: selected.student_user_id,
          event_key: `feedback:${selected.id}:${selected.status}`,
          title: data.get("title"),
          body: data.get("body"),
          deep_link: `/applications/${selected.id}`,
        }),
      });
      setNotice(
        "Constructive feedback published once for this application status.",
      );
      event.currentTarget.reset();
    } catch {
      setError(
        "Feedback was not published. Use a safe internal destination and refresh the application state before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function previewBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft = {
      application_ids: data.getAll("application_ids").map(String),
      status: String(data.get("status")),
      reason: String(data.get("reason")),
    };
    setBusy(true);
    setError("");
    try {
      setBulkPreview(await csrfRequest<BulkPreview>("/admin/recruitment/applications/bulk/preview", {
        method: "POST",
        body: JSON.stringify(draft),
      }));
      setBulkDraft(draft);
    } catch {
      setError("The bulk preview could not be prepared. Select 1–100 applications and provide constructive feedback.");
    } finally {
      setBusy(false);
    }
  }

  async function applyBulk() {
    if (!bulkDraft || !bulkPreview || bulkPreview.blocked_count) return;
    setBusy(true);
    setError("");
    try {
      const result = await csrfRequest<{ updated_count: number; notification_count: number }>("/admin/recruitment/applications/bulk/status", {
        method: "POST",
        body: JSON.stringify({ ...bulkDraft, confirmation: "APPLY BULK STATUS" }),
      });
      setNotice(`${result.updated_count} applications updated; ${result.notification_count} students notified.`);
      setBulkPreview(null);
      setBulkDraft(null);
      await load();
    } catch {
      setError("The bulk action was not applied. Reauthenticate, refresh the preview, and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div>
          <p>Accountable review</p>
          <h1>Applications</h1>
          <span>
            Eligibility checks, saved application details, and human decisions
            remain visibly separate.
          </span>
        </div>
        <button type="button" onClick={() => void load()}>
          <RefreshCcw aria-hidden="true" />
          Refresh
        </button>
      </header>
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      <nav className={styles.filters} aria-label="Application status filters">
        {statuses.map((status) => (
          <button
            type="button"
            key={status}
            aria-current={filter === status ? "page" : undefined}
            onClick={() => { setFilter(status); setPage(1); }}
          >
            {status.replaceAll("_", " ")}
            {filter === status ? <span>{total}</span> : null}
          </button>
        ))}
      </nav>

      <details className={styles.bulkPanel}>
        <summary>Bulk review with preview</summary>
        <form onSubmit={previewBulk}>
          <label>Applications<select name="application_ids" multiple required size={Math.min(6, Math.max(2, visible.length))}>{visible.map((application) => <option key={application.id} value={application.id}>{application.student_name} · {roleName(application)} · {application.status.replaceAll("_", " ")}</option>)}</select><small>Use Ctrl/Cmd to select several records.</small></label>
          <label>Target status<select name="status" defaultValue="under_review"><option value="under_review">Under review</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="offered">Offered</option><option value="rejected">Rejected</option></select></label>
          <label>Helpful feedback<textarea name="reason" required minLength={10} maxLength={500} placeholder="Explain the decision and give the student a useful next step." /></label>
          <button type="submit" disabled={busy}>Preview changes</button>
        </form>
        {bulkPreview ? <section className={styles.bulkPreview} aria-label="Bulk action preview"><header><strong>{bulkPreview.allowed_count} allowed · {bulkPreview.blocked_count} blocked</strong><span>No changes have been applied.</span></header><ul>{bulkPreview.items.map((item) => <li key={item.application_id}><Badge tone={item.allowed ? "success" : "warning"}>{item.allowed ? "allowed" : "blocked"}</Badge><span>{item.current_status.replaceAll("_", " ")} → {item.target_status.replaceAll("_", " ")}</span><small>{item.explanation}</small></li>)}</ul><button type="button" disabled={busy || Boolean(bulkPreview.blocked_count)} onClick={() => void applyBulk()}>Confirm and notify students</button></section> : null}
      </details>

      <div className={styles.workspace} aria-busy={loading}>
        <section className={styles.queue} aria-labelledby="application-queue">
          <div className={styles.sectionHeader}>
            <h2 id="application-queue">Candidate queue</h2>
            <span>{total} records</span>
          </div>
          {loading ? <p>Loading application records…</p> : null}
          {!loading && !visible.length ? (
            <EmptyState title="No applications in this view">
              <span>
                Choose another status or wait for a student submission.
              </span>
            </EmptyState>
          ) : null}
          <div className={styles.queueList}>
            {visible.map((application) => (
              <button
                type="button"
                key={application.id}
                className={
                  application.id === selected?.id ? styles.selected : ""
                }
                onClick={() => setSelectedId(application.id)}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {application.student_user_id.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <strong>{roleName(application)}</strong>
                  <small>
                    {companyName(application)} ·{" "}
                    {new Date(application.created_at).toLocaleDateString()}
                  </small>
                </span>
                <Badge
                  tone={
                    application.status === "shortlisted" ||
                    application.status === "offered"
                      ? "success"
                      : application.status === "rejected"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {application.status.replaceAll("_", " ")}
                </Badge>
                <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
          {total > pageSize ? (
            <nav className={styles.pagination} aria-label="Application pages">
              <button type="button" disabled={loading || page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
              <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span>
              <button type="button" disabled={loading || page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>Next</button>
            </nav>
          ) : null}
        </section>

        <section
          className={styles.inspector}
          aria-label="Candidate decision details"
        >
          {!selected ? (
            <EmptyState title="Select an application">
              <span>
                Its saved decision details and status history will appear
                here.
              </span>
            </EmptyState>
          ) : (
            <>
              <header>
                <div>
                  <p>{companyName(selected)}</p>
                  <h2>{roleName(selected)}</h2>
                  <span>
                    {selected.student_name ??
                      selected.student_user_id.slice(0, 8)}{" "}
                    · {selected.student_email ?? "email unavailable"} ·
                    submitted {new Date(selected.created_at).toLocaleString()}
                  </span>
                </div>
                <Badge
                  tone={
                    selected.status === "shortlisted" ||
                    selected.status === "offered"
                      ? "success"
                      : "neutral"
                  }
                >
                  {selected.status.replaceAll("_", " ")}
                </Badge>
              </header>
              <div className={styles.snapshotGrid}>
                <article>
                  <FileLock2 aria-hidden="true" />
                  <div>
                    <strong>Resume snapshot</strong>
                    <p>
                      Version{" "}
                      {String(selected.resume_snapshot.version_number ?? "—")} ·{" "}
                      {String(
                        selected.resume_snapshot.original_name ??
                          "reviewed PDF",
                      )}
                    </p>
                    <code>
                      {String(selected.resume_snapshot.checksum ?? "").slice(
                        0,
                        14,
                      )}
                      …
                    </code>
                  </div>
                </article>
                <article>
                  <ShieldCheck aria-hidden="true" />
                  <div>
                    <strong>Eligibility version</strong>
                    <p>Rule v{String(selected.rule_snapshot.version ?? "—")}</p>
                    <code>
                      {String(selected.rule_snapshot.id ?? "").slice(0, 14)}…
                    </code>
                  </div>
                </article>
              </div>
              <section className={styles.evidence}>
                <div className={styles.sectionHeader}>
                  <h3>Rule-by-rule results</h3>
                  <Badge
                    tone={
                      selected.eligibility_snapshot.status === "eligible"
                        ? "success"
                        : "warning"
                    }
                  >
                    {selected.eligibility_snapshot.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <ul>
                  {selected.eligibility_snapshot.results.map((result) => (
                    <li key={result.label}>
                      {result.passed === true ? (
                        <CheckCircle2
                          className={styles.pass}
                          aria-hidden="true"
                        />
                      ) : (
                        <CircleAlert
                          className={styles.review}
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <strong>{result.label}</strong>
                        <p>{result.reason}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <section className={styles.actions}>
                <div className={styles.sectionHeader}>
                  <h3>Decision actions</h3>
                  <span>Validated sequence</span>
                </div>
                <div>
                  {selected.status === "submitted" ? (
                    <button
                      disabled={busy}
                      type="button"
                      onClick={() => void changeStatus("under_review")}
                    >
                      Start review
                    </button>
                  ) : null}
                  {selected.status === "under_review" ? (
                    <>
                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => void changeStatus("shortlisted")}
                      >
                        Shortlist
                      </button>
                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => void changeStatus("rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {selected.status === "shortlisted" ? (
                    <button
                      disabled={busy}
                      type="button"
                      onClick={() => void changeStatus("interview")}
                    >
                      Move to interview
                    </button>
                  ) : null}
                  {selected.status === "interview" ? (
                    <>
                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => void changeStatus("offered")}
                      >
                        Record offer
                      </button>
                      <button
                        disabled={busy}
                        type="button"
                        onClick={() => void changeStatus("rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                </div>
              </section>
              <details className={styles.feedback}>
                <summary>Publish student feedback</summary>
                <form onSubmit={sendFeedback}>
                  <label>
                    <span>Update title</span>
                    <input
                      name="title"
                      required
                      minLength={3}
                      maxLength={180}
                      placeholder="Next step after application review"
                    />
                  </label>
                  <label>
                    <span>Constructive feedback</span>
                    <textarea
                      name="body"
                      required
                      minLength={3}
                      maxLength={2000}
                      rows={3}
                      placeholder="Explain the decision and one useful next action."
                    />
                  </label>
                  <button type="submit" disabled={busy}>
                    Publish update
                  </button>
                  <small>
                    Deduplicated for this application status. The destination
                    stays inside CampusHire.
                  </small>
                </form>
              </details>
              <details className={styles.override}>
                <summary>Authorized override</summary>
                <form onSubmit={override}>
                  <Alert tone="warning">
                    Use only when policy allows an exception. The reason becomes
                    a locked audit record.
                  </Alert>
                  <Select
                    id="override-status"
                    name="status"
                    label="Override decision"
                  >
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                  <label>
                    <span>Reason</span>
                    <textarea
                      name="reason"
                      required
                      minLength={10}
                      maxLength={500}
                      rows={3}
                    />
                  </label>
                  <label>
                    <span>Policy reference</span>
                    <input name="policy_reference" required minLength={3} maxLength={300} placeholder="Published policy section or evidence ID" />
                  </label>
                  <button type="submit" disabled={busy}>
                    Record override
                  </button>
                </form>
              </details>
              <section className={styles.timeline}>
                <div className={styles.sectionHeader}>
                  <h3>
                    <History aria-hidden="true" />
                    Status history
                  </h3>
                  <span>Append-only</span>
                </div>
                <ol>
                  {selected.history.map((event) => (
                    <li key={event.id}>
                      <Clock3 aria-hidden="true" />
                      <div>
                        <strong>{event.to_status.replaceAll("_", " ")}</strong>
                        <p>{event.reason || "No additional reason recorded"}</p>
                        <small>
                          {new Date(event.created_at).toLocaleString()} · actor{" "}
                          {event.actor_user_id.slice(0, 8)}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
