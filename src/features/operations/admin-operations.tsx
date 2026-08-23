"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Ban,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  ServerCog,
  ShieldAlert,
} from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import type {
  OperationsSummaryResponse,
  ResumeJobOperatorResponse,
  ResumeJobPage,
} from "@/lib/api/generated";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./admin-operations.module.css";

const statusLabels: Record<string, string> = {
  queued: "Queued",
  processing: "Processing",
  cancellation_requested: "Cancellation requested",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

function tone(status: string): "neutral" | "success" | "warning" {
  if (status === "completed") return "success";
  if (["failed", "cancellation_requested"].includes(status)) return "warning";
  return "neutral";
}

function formatDate(value: string | null): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Invalid timestamp" : date.toLocaleString();
}

function retryable(job: ResumeJobOperatorResponse): boolean {
  return (
    job.status === "failed" &&
    ["resume_scan_unavailable", "resume_storage_unavailable", "resume_worker_interrupted"].includes(
      job.safe_error_code ?? "",
    ) &&
    job.attempts < job.max_attempts
  );
}

function cancellable(job: ResumeJobOperatorResponse): boolean {
  return !["completed", "cancelled"].includes(job.status);
}

export function AdminOperations() {
  const [summary, setSummary] = useState<OperationsSummaryResponse | null>(null);
  const [page, setPage] = useState<ResumeJobPage | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const query = filter ? `?job_status=${encodeURIComponent(filter)}` : "";
      const [summaryData, jobData] = await Promise.all([
        apiRequest<OperationsSummaryResponse>("/admin/operations/summary", {
          cache: "no-store",
        }),
        apiRequest<ResumeJobPage>(`/admin/operations/resume-jobs${query}`, {
          cache: "no-store",
        }),
      ]);
      setSummary(summaryData);
      setPage(jobData);
    } catch {
      setError(
        "Worker operations could not be refreshed. Existing jobs remain durable and unchanged.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function act(job: ResumeJobOperatorResponse, action: "cancel" | "retry") {
    setActionId(job.id);
    setError("");
    setNotice("");
    try {
      await csrfRequest<ResumeJobOperatorResponse>(
        `/admin/operations/resume-jobs/${job.id}/${action}`,
        { method: "POST" },
      );
      setNotice(
        action === "cancel"
          ? "The cancellation was recorded and will stop at the next safe boundary."
          : "The job was returned to the durable queue within its retry budget.",
      );
      await load();
    } catch {
      setError(
        `The job could not be ${action === "cancel" ? "cancelled" : "retried"}. Refresh its current state before trying again.`,
      );
    } finally {
      setActionId(null);
    }
  }

  const jobs = page?.items ?? [];
  return (
    <main id="main-content" className={styles.page} aria-busy={loading}>
      <header className={styles.header}>
        <div>
          <p>Operational control</p>
          <h1>Background jobs</h1>
          <span>
            Tenant-scoped resume processing with bounded leases, retry budgets, and an immutable event trail.
          </span>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCw aria-hidden="true" /> Refresh
        </button>
      </header>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      <section className={styles.metrics} aria-label="Worker health summary">
        <article>
          <Activity aria-hidden="true" />
          <span>Active leases</span>
          <strong>{summary?.active_leases ?? "—"}</strong>
          <small>Claims whose lease has not expired</small>
        </article>
        <article>
          <Clock3 aria-hidden="true" />
          <span>Oldest queued</span>
          <strong>
            {summary?.oldest_queued_age_seconds == null
              ? "None"
              : `${summary.oldest_queued_age_seconds}s`}
          </strong>
          <small>Measured from durable availability time</small>
        </article>
        <article>
          <ShieldAlert aria-hidden="true" />
          <span>Retry budget exhausted</span>
          <strong>{summary?.exhausted_failures ?? "—"}</strong>
          <small>Terminal failures requiring investigation</small>
        </article>
        <article>
          <ServerCog aria-hidden="true" />
          <span>Total visible</span>
          <strong>{page?.total ?? "—"}</strong>
          <small>Only jobs from the active institution</small>
        </article>
      </section>

      <section className={styles.queue} aria-labelledby="job-queue-title">
        <div className={styles.queueHeader}>
          <div>
            <p>Durable queue</p>
            <h2 id="job-queue-title">Resume processing history</h2>
          </div>
          <label>
            Status
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="">All states</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {loading && !page ? <div className={styles.loading} role="status">Loading durable job state…</div> : null}
        {!loading && jobs.length === 0 ? (
          <EmptyState title="No jobs in this state">
            The selected institution has no matching resume-processing jobs.
          </EmptyState>
        ) : null}

        <div className={styles.jobList}>
          {jobs.map((job) => (
            <article className={styles.job} key={job.id}>
              <div className={styles.jobSummary}>
                <span className={styles.jobIcon} aria-hidden="true">
                  {job.status === "completed" ? <CheckCircle2 /> : job.status === "cancelled" ? <Ban /> : <ServerCog />}
                </span>
                <div>
                  <strong>Resume job {job.id.slice(0, 8)}</strong>
                  <span>Version {job.resume_version_id.slice(0, 8)} · attempt {job.attempts} of {job.max_attempts}</span>
                </div>
                <Badge tone={tone(job.status)}>{statusLabels[job.status] ?? job.status}</Badge>
                <time dateTime={job.available_at}>{formatDate(job.available_at)}</time>
              </div>
              <div className={styles.jobMeta}>
                <span><strong>Worker</strong>{job.claimed_by ?? "Unclaimed"}</span>
                <span><strong>Lease expiry</strong>{formatDate(job.lease_expires_at)}</span>
                <span><strong>Duration</strong>{job.duration_ms == null ? "Not complete" : `${job.duration_ms} ms`}</span>
                <span><strong>Safe error</strong>{job.safe_error_code ?? "None"}</span>
              </div>
              <div className={styles.actions}>
                {retryable(job) ? (
                  <button type="button" disabled={actionId === job.id} onClick={() => void act(job, "retry")}>
                    <RotateCcw aria-hidden="true" /> Retry safely
                  </button>
                ) : null}
                {cancellable(job) ? (
                  <button type="button" disabled={actionId === job.id} onClick={() => void act(job, "cancel")}>
                    <Ban aria-hidden="true" /> Cancel job
                  </button>
                ) : null}
              </div>
              <details className={styles.timeline}>
                <summary>Event timeline ({job.events?.length ?? 0})</summary>
                {job.events?.length ? (
                  <ol>
                    {job.events.map((event) => (
                      <li key={event.id}>
                        <span>{event.event_type.replaceAll("_", " ")}</span>
                        <small>Attempt {event.attempt} · {formatDate(event.occurred_at)}</small>
                        <code>{event.correlation_id ?? "worker event"}</code>
                      </li>
                    ))}
                  </ol>
                ) : <p>No events were recorded for this legacy job.</p>}
              </details>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
