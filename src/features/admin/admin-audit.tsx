"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, Filter, Save, ShieldCheck } from "lucide-react";

import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { apiPath, apiRequest } from "@/lib/api/client";
import styles from "./admin-audit.module.css";

type AuditEvent = {
  id: string;
  actor_user_id: string | null;
  event_type: string;
  resource_type: string | null;
  resource_id: string | null;
  outcome: string;
  reason: string | null;
  correlation_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

type AuditPage = { items: AuditEvent[]; page: number; page_size: number; total: number };
type Filters = {
  action: string;
  resource_type: string;
  outcome: string;
  actor_user_id: string;
  correlation_id: string;
  start_at: string;
  end_at: string;
  sort: "asc" | "desc";
};

const emptyFilters: Filters = {
  action: "",
  resource_type: "",
  outcome: "",
  actor_user_id: "",
  correlation_id: "",
  start_at: "",
  end_at: "",
  sort: "desc",
};

function queryFor(filters: Filters, page?: number) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  if (page) query.set("page", String(page));
  query.set("page_size", "25");
  return query;
}

export function AdminAudit() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState<AuditPage | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const query = queryFor(applied, pageNumber);
      setPage(await apiRequest<AuditPage>(`/admin/audit/events?${query}`, { cache: "no-store" }));
      setState("ready");
      setMessage("");
    } catch {
      setState("error");
      setMessage("Audit evidence could not be loaded. No records were changed.");
    }
  }, [applied, pageNumber]);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const exportHref = useMemo(() => {
    const query = queryFor(applied);
    query.delete("page_size");
    return apiPath(`/admin/audit/export.csv?${query}`);
  }, [applied]);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageNumber(1);
    setApplied(filters);
  }

  function saveView() {
    window.localStorage.setItem("campushire.admin.audit-view", JSON.stringify(filters));
    setMessage("Audit view saved on this device.");
  }

  function restoreView() {
    const stored = window.localStorage.getItem("campushire.admin.audit-view");
    if (!stored) {
      setMessage("No saved audit view exists on this device.");
      return;
    }
    try {
      const restored = { ...emptyFilters, ...(JSON.parse(stored) as Partial<Filters>) };
      setFilters(restored);
      setApplied(restored);
      setPageNumber(1);
      setMessage("Saved audit view restored.");
    } catch {
      setMessage("The saved audit view is invalid and was not applied.");
    }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header>
        <div><p className="eyebrow">Accountable operations</p><h1>Audit</h1><span>Tenant-scoped, privacy-minimized evidence for sensitive actions and decisions.</span></div>
        <a className={styles.export} href={exportHref} download><Download aria-hidden="true" /> Export filtered CSV</a>
      </header>

      <details className={styles.filters} open>
        <summary><Filter aria-hidden="true" /> Filter audit evidence</summary>
        <form onSubmit={apply}>
          <label>Action<input value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} placeholder="application.status_changed" /></label>
          <label>Resource<select value={filters.resource_type} onChange={(event) => setFilters({ ...filters, resource_type: event.target.value })}><option value="">All resources</option><option value="application">Application</option><option value="placement_drive">Drive</option><option value="institution_membership">Membership</option><option value="policy_document">Policy</option><option value="resume_processing_job">Resume job</option></select></label>
          <label>Outcome<select value={filters.outcome} onChange={(event) => setFilters({ ...filters, outcome: event.target.value })}><option value="">All outcomes</option><option value="success">Success</option><option value="denied">Denied</option><option value="failure">Failure</option></select></label>
          <label>Actor ID<input value={filters.actor_user_id} onChange={(event) => setFilters({ ...filters, actor_user_id: event.target.value })} /></label>
          <label>Correlation ID<input value={filters.correlation_id} onChange={(event) => setFilters({ ...filters, correlation_id: event.target.value })} /></label>
          <label>From<input type="datetime-local" value={filters.start_at} onChange={(event) => setFilters({ ...filters, start_at: event.target.value })} /></label>
          <label>Until<input type="datetime-local" value={filters.end_at} onChange={(event) => setFilters({ ...filters, end_at: event.target.value })} /></label>
          <label>Order<select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value as Filters["sort"] })}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select></label>
          <div className={styles.filterActions}><button type="submit">Apply filters</button><button type="button" onClick={saveView}><Save aria-hidden="true" /> Save view</button><button type="button" onClick={restoreView}>Restore view</button><button type="button" onClick={() => { setFilters(emptyFilters); setApplied(emptyFilters); setPageNumber(1); }}>Clear</button></div>
        </form>
      </details>

      {message ? <Alert tone={state === "error" ? "error" : "info"}>{message}</Alert> : null}
      {state === "loading" ? <RequestState state="loading" title="Loading audit evidence">Applying tenant and privacy boundaries.</RequestState> : null}
      {state === "error" ? <RequestState state="error" title="Audit evidence is unavailable" onRetry={() => void load()}>{message}</RequestState> : null}
      {state === "ready" && page && !page.items.length ? <RequestState state="empty" title="No audit events match">Clear or broaden the filters to inspect other accountable actions.</RequestState> : null}
      {state === "ready" && page?.items.length ? <section className={styles.results} aria-labelledby="results-title"><header><div><h2 id="results-title">Recorded events</h2><p>{page.total} matching records</p></div><ShieldCheck aria-hidden="true" /></header><ol>{page.items.map((event) => <li key={event.id}><div className={styles.eventHeading}><div><strong>{event.event_type.replaceAll("_", " ")}</strong><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></div><Badge tone={event.outcome === "success" ? "success" : "warning"}>{event.outcome}</Badge></div><dl><div><dt>Resource</dt><dd>{event.resource_type ?? "General"} · {event.resource_id ?? "—"}</dd></div><div><dt>Actor</dt><dd>{event.actor_user_id ?? "System"}</dd></div><div><dt>Correlation</dt><dd>{event.correlation_id ?? "Not recorded"}</dd></div></dl>{event.reason ? <p>{event.reason}</p> : null}{Object.keys(event.details).length ? <details><summary>View safe metadata</summary><pre>{JSON.stringify(event.details, null, 2)}</pre></details> : null}</li>)}</ol><nav aria-label="Audit pagination"><button disabled={pageNumber === 1} onClick={() => setPageNumber((value) => value - 1)}>Previous</button><span>Page {pageNumber} of {Math.max(1, Math.ceil(page.total / page.page_size))}</span><button disabled={pageNumber * page.page_size >= page.total} onClick={() => setPageNumber((value) => value + 1)}>Next</button></nav></section> : null}
    </main>
  );
}
