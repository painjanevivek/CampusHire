"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Copy,
  Download, KeyRound, Search, Settings2, ShieldCheck, UserRound, X,
  type LucideIcon,
} from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import { apiPath, apiRequest } from "@/lib/api/client";
import styles from "./admin-audit.module.css";

type AuditEvent = {
  id: string; actor_user_id: string | null; event_type: string;
  resource_type: string | null; resource_id: string | null;
  outcome: string; reason: string | null; correlation_id: string | null;
  details: Record<string, unknown>; created_at: string;
};
type AuditPage = { items: AuditEvent[]; page: number; page_size: number; total: number };
type User = { id: string; institution_id: string };
type Filters = {
  action: string; resource_type: string; outcome: string; actor_user_id: string;
  correlation_id: string; start_at: string; end_at: string; sort: "asc" | "desc";
};
type SortMode = Filters["sort"] | "event" | "actor";
const emptyFilters: Filters = {
  action: "", resource_type: "", outcome: "", actor_user_id: "",
  correlation_id: "", start_at: "", end_at: "", sort: "desc",
};
const eventNames: Record<string, string> = {
  "auth.staff_terms_accepted": "Staff terms accepted",
  "auth.sign_in": "Signed in",
  "membership.status_changed": "Membership status changed",
  "eligibility_rule_set.created": "Eligibility rule set created",
  "role.created": "Role created",
  "drive.created": "Placement drive created",
  "company.created": "Company created",
};
const resourceNames: Record<string, string> = {
  placement_drive: "Placement drive", placement_role: "Role",
  institution_membership: "Membership", eligibility_rule_set: "Eligibility rule set",
};
function queryFor(filters: Filters, page?: number) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  if (page) query.set("page", String(page));
  query.set("page_size", "25");
  return query;
}
function readable(value: string) {
  return value.replaceAll(/[._]/g, " ").replaceAll(/\s+/g, " ").trim().replace(/^./, (letter) => letter.toUpperCase());
}
function eventTitle(value: string) { return eventNames[value] ?? readable(value); }
function resourceTitle(value: string | null) { return value ? resourceNames[value] ?? readable(value) : "System"; }
function shortId(value: string) { return value.length > 18 ? value.slice(0, 8) + "…" + value.slice(-4) : value; }
function safeName(details: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
function category(event: AuditEvent): { label: string; icon: LucideIcon } {
  const key = event.event_type;
  if (key.startsWith("auth.")) return { label: "Authentication", icon: KeyRound };
  if (key.startsWith("membership.")) return { label: "Membership", icon: UserRound };
  if (key.startsWith("company.")) return { label: "Company", icon: Building2 };
  if (key.startsWith("drive.")) return { label: "Placement drive", icon: Building2 };
  if (key.startsWith("eligibility_")) return { label: "Eligibility", icon: ShieldCheck };
  if (key.startsWith("role.") || key.includes("permission")) return { label: "Roles and permissions", icon: KeyRound };
  return { label: "System", icon: ClipboardList };
}
function outcomeLabel(value: string) {
  if (value === "success") return "Success";
  if (value === "failure" || value === "failed") return "Failed";
  if (value === "denied" || value === "blocked") return "Blocked";
  if (value === "warning") return "Warning";
  return readable(value);
}
function outcomeClass(value: string) {
  if (value === "success") return styles.statusSuccess;
  if (value === "failure" || value === "failed") return styles.statusFailed;
  if (value === "denied" || value === "blocked") return styles.statusBlocked;
  return styles.statusWarning;
}
function dateHeading(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const full = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(date);
  if (date.toDateString() === today.toDateString()) return "Today — " + full;
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday — " + full;
  return full;
}
function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date).replace(",", " ·");
}
function paginationItems(current: number, total: number): Array<number | null> {
  const visible = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  const result: Array<number | null> = [];
  visible.forEach((value, index) => {
    if (index && value - visible[index - 1] > 1) result.push(null);
    result.push(value);
  });
  return result;
}
function Identifier({ label, value, onCopy }: { label: string; value: string | null; onCopy: (value: string) => void }) {
  return <div className={styles.identifier}>
    <dt>{label}</dt>
    <dd>{value ? <><span title={value}>{shortId(value)}</span><button type="button" title={"Copy " + label} aria-label={"Copy " + label} onClick={() => onCopy(value)}><Copy aria-hidden="true" /></button></> : "Not recorded"}</dd>
  </div>;
}

export function AdminAudit() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("desc");
  const [datePreset, setDatePreset] = useState("all");
  const [page, setPage] = useState<AuditPage | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setState("loading");
    try {
      const result = await apiRequest<AuditPage>("/admin/audit/events?" + queryFor(applied, pageNumber), { cache: "no-store" });
      setPage(result);
      window.localStorage.removeItem("campushire.admin.audit-view");
      setState("ready");
      setMessage("");
    } catch {
      setState("error");
      setMessage("Institution audit records could not be loaded.");
    }
  }, [applied, pageNumber]);
  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);
  const exportHref = useMemo(() => {
    const query = queryFor(applied);
    query.delete("page_size");
    return apiPath("/admin/audit/export.csv?" + query);
  }, [applied]);
  const visibleEvents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const items = (page?.items ?? []).filter((event) => {
      if (!term) return true;
      const actorName = safeName(event.details, ["actor_name", "actor_display_name", "actor_email"]);
      const resourceName = safeName(event.details, ["resource_name", "company_name", "drive_title"]);
      return [
        event.event_type, eventTitle(event.event_type), event.actor_user_id, actorName,
        event.resource_type, resourceTitle(event.resource_type), event.resource_id, resourceName,
        event.correlation_id,
      ].some((value) => value?.toLocaleLowerCase().includes(term));
    });
    if (sortMode === "event") items.sort((a, b) => eventTitle(a.event_type).localeCompare(eventTitle(b.event_type)) || b.created_at.localeCompare(a.created_at));
    if (sortMode === "actor") items.sort((a, b) => (safeName(a.details, ["actor_name", "actor_display_name", "actor_email"]) ?? a.actor_user_id ?? "").localeCompare(safeName(b.details, ["actor_name", "actor_display_name", "actor_email"]) ?? b.actor_user_id ?? "") || b.created_at.localeCompare(a.created_at));
    return items;
  }, [page, search, sortMode]);
  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / (page?.page_size ?? 25)));
  const hasServerFilters = Object.entries(applied).some(([key, value]) => key !== "sort" && Boolean(value));
  const eventOptions = [...new Set([...(page?.items.map((event) => event.event_type) ?? []), filters.action].filter(Boolean))].sort();
  const actorOptions = [...new Set([...(page?.items.map((event) => event.actor_user_id) ?? []), filters.actor_user_id].filter((value): value is string => Boolean(value)))].sort();

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageNumber(1);
    setApplied({ ...filters });
  }
  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }
  function removeFilter(key: keyof Filters) {
    const next = { ...applied, [key]: emptyFilters[key] };
    setFilters(next); setApplied(next); setPageNumber(1);
    if (key === "start_at" || key === "end_at") setDatePreset("all");
  }
  function changeDatePreset(value: string) {
    setDatePreset(value);
    if (value === "7" || value === "30") {
      const start = new Date();
      start.setDate(start.getDate() - Number(value));
      setFilters((current) => ({ ...current, start_at: start.toISOString(), end_at: "" }));
    } else if (value === "all") {
      setFilters((current) => ({ ...current, start_at: "", end_at: "" }));
    }
  }
  function changeSort(value: SortMode) {
    setSortMode(value);
    if (value === "asc" || value === "desc") {
      setFilters((current) => ({ ...current, sort: value }));
      setApplied((current) => ({ ...current, sort: value }));
      setPageNumber(1);
    }
  }
  function toggleEvent(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  async function copyId(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage("Full identifier copied."); }
    catch { setMessage("Clipboard unavailable. The complete identifier is in the tooltip."); }
  }
  async function currentSavedViewKey() {
    const me = await apiRequest<User>("/auth/me", { cache: "no-store" });
    return "campushire.admin.audit-view." + me.id + "." + me.institution_id;
  }
  async function saveView() {
    try {
      const key = await currentSavedViewKey();
      window.sessionStorage.setItem(key, JSON.stringify(filters));
      setMessage("Audit view saved for this signed-in session.");
    } catch { setMessage("The signed-in account could not be verified, so the view was not saved."); }
  }
  async function restoreView() {
    try {
      const key = await currentSavedViewKey();
      const stored = window.sessionStorage.getItem(key);
      if (!stored) { setMessage("No saved audit view exists in this session."); return; }
      const restored = { ...emptyFilters, ...(JSON.parse(stored) as Partial<Filters>) };
      setFilters(restored); setApplied(restored); setSortMode(restored.sort);
      setDatePreset(restored.start_at || restored.end_at ? "custom" : "all");
      setPageNumber(1); setMessage("Saved audit view restored.");
    } catch { setMessage("The saved audit view is invalid and was not applied."); }
  }
  let previousDate = "";
  return <main id="main-content" className={styles.page}>
    <header className={styles.pageHeader}>
      <div><h1>Audit</h1><p>Review sensitive actions and system changes within your institution.</p><span className={styles.eventCount}>{page?.total.toLocaleString() ?? "—"} events</span></div>
      <a className={styles.export} href={exportHref} download title="Export all records matching the applied server filters"><Download aria-hidden="true" /> Export CSV</a>
    </header>
    <section className={styles.toolbar} aria-label="Audit filters">
      <form onSubmit={apply}>
        <div className={styles.toolbarMain}>
          <label className={styles.searchField}><span>Search this page</span><span className={styles.searchInput}><Search aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, actors, resources or IDs on this page" /></span></label>
          <label><span>Event type</span><select value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}><option value="">All event types</option>{eventOptions.map((value) => <option key={value} value={value}>{eventTitle(value)}</option>)}</select></label>
          <label><span>Actor</span><select value={filters.actor_user_id} onChange={(event) => updateFilter("actor_user_id", event.target.value)}><option value="">All actors</option>{actorOptions.map((value) => <option key={value} value={value}>{shortId(value)}</option>)}</select></label>
          <label><span>Status</span><select value={filters.outcome} onChange={(event) => updateFilter("outcome", event.target.value)}><option value="">All statuses</option><option value="success">Success</option><option value="failure">Failed</option><option value="warning">Warning</option><option value="denied">Blocked</option></select></label>
          <label><span>Date range</span><select value={datePreset} onChange={(event) => changeDatePreset(event.target.value)}><option value="all">All dates</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="custom">Custom range</option></select></label>
          <button className={styles.applyButton} type="submit">Apply filters</button>
        </div>
        <div className={styles.toolbarMore}>
          <details><summary><Settings2 aria-hidden="true" /> More filters</summary>
            <div className={styles.advanced}>
              <label>Action<input value={filters.action} onChange={(event) => updateFilter("action", event.target.value)} placeholder="Exact event key" /></label>
              <label>Resource<select value={filters.resource_type} onChange={(event) => updateFilter("resource_type", event.target.value)}><option value="">All resources</option><option value="application">Application</option><option value="placement_drive">Drive</option><option value="institution_membership">Membership</option><option value="policy_document">Policy</option><option value="resume_processing_job">Resume job</option></select></label>
              <label>Actor ID<input value={filters.actor_user_id} onChange={(event) => updateFilter("actor_user_id", event.target.value)} placeholder="Complete actor UUID" /></label>
              <label>Correlation ID<input value={filters.correlation_id} onChange={(event) => updateFilter("correlation_id", event.target.value)} /></label>
              <label>From<input type="datetime-local" value={datePreset === "custom" ? filters.start_at : ""} onChange={(event) => { setDatePreset("custom"); updateFilter("start_at", event.target.value); }} /></label>
              <label>Until<input type="datetime-local" value={datePreset === "custom" ? filters.end_at : ""} onChange={(event) => { setDatePreset("custom"); updateFilter("end_at", event.target.value); }} /></label>
              <div className={styles.savedActions}><button type="button" onClick={() => void saveView()}>Save view</button><button type="button" onClick={() => void restoreView()}>Restore view</button></div>
            </div>
          </details>
          <label className={styles.sortField}><span>Sort</span><select value={sortMode} onChange={(event) => changeSort(event.target.value as SortMode)}><option value="desc">Newest first</option><option value="asc">Oldest first</option><option value="event">Event type · this page</option><option value="actor">Actor · this page</option></select></label>
        </div>
      </form>
      {hasServerFilters || search ? <div className={styles.chips} aria-label="Active filters">
        {Object.entries(applied).filter(([key, value]) => key !== "sort" && Boolean(value)).map(([key, value]) => <button type="button" key={key} onClick={() => removeFilter(key as keyof Filters)}>{({ action: "Event", resource_type: "Resource", outcome: "Status", actor_user_id: "Actor", correlation_id: "Correlation", start_at: "From", end_at: "Until" } as Record<string, string>)[key]}: {key === "action" ? eventTitle(value) : key === "outcome" ? outcomeLabel(value) : key === "actor_user_id" || key === "correlation_id" ? shortId(value) : value}<X aria-hidden="true" /></button>)}
        {search ? <button type="button" onClick={() => setSearch("")}>Page search: {search}<X aria-hidden="true" /></button> : null}
        <button type="button" className={styles.clearAll} onClick={() => { setFilters(emptyFilters); setApplied(emptyFilters); setSearch(""); setDatePreset("all"); setSortMode("desc"); setPageNumber(1); }}>Clear all</button>
      </div> : null}
    </section>
    {message && state !== "error" ? <Alert tone="info">{message}</Alert> : null}
    {state === "loading" ? <section className={styles.skeletonList} aria-label="Loading audit records" aria-busy="true">{Array.from({ length: 5 }, (_, index) => <div key={index}><span /><span /><span /></div>)}</section> : null}
    {state === "error" ? <section className={styles.statePanel} role="alert"><h2>Audit records are unavailable</h2><p>{message}</p><button type="button" onClick={() => void load()}>Retry</button></section> : null}
    {state === "ready" && page && page.total === 0 ? <section className={styles.statePanel}><h2>{hasServerFilters ? "No events match these filters." : "No audit events found."}</h2><p>{hasServerFilters ? "Try a broader event type, date range or status." : "Recorded institution activity will appear here."}</p>{hasServerFilters ? <button type="button" onClick={() => { setFilters(emptyFilters); setApplied(emptyFilters); setDatePreset("all"); setPageNumber(1); }}>Clear filters</button> : null}</section> : null}
    {state === "ready" && page && page.total > 0 ? <section className={styles.results} aria-label="Audit events">
      {search || sortMode === "event" || sortMode === "actor" ? <p className={styles.pageScope}>Showing {visibleEvents.length} of {page.items.length} records on this page. Search and actor/event sorting apply to this page; CSV export uses the applied institution filters.</p> : null}
      {visibleEvents.length ? <ol>{visibleEvents.map((event) => {
        const date = dateHeading(event.created_at);
        const showDate = date !== previousDate;
        previousDate = date;
        const kind = category(event);
        const Icon = kind.icon;
        const actorName = safeName(event.details, ["actor_name", "actor_display_name", "actor_email"]);
        const resourceName = safeName(event.details, ["resource_name", "company_name", "drive_title"]);
        const expanded = expandedIds.has(event.id);
        return <li key={event.id}>
          {showDate ? <p className={styles.dateSeparator}>{date}</p> : null}
          <article className={styles.event}>
            <div className={styles.eventSummary}>
              <span className={styles.eventIcon} title={kind.label}><Icon aria-hidden="true" /></span>
              <div className={styles.eventIdentity}><strong>{eventTitle(event.event_type)}</strong><span>{kind.label} · {actorName ?? (event.actor_user_id ? shortId(event.actor_user_id) : "System")} · {resourceName ?? resourceTitle(event.resource_type)}</span></div>
              <time dateTime={event.created_at} title={new Date(event.created_at).toLocaleString()}>{displayTime(event.created_at)}</time>
              <span className={styles.status + " " + outcomeClass(event.outcome)}>{outcomeLabel(event.outcome)}</span>
              <button type="button" className={styles.expand} aria-label={(expanded ? "Collapse " : "Expand ") + eventTitle(event.event_type)} aria-expanded={expanded} aria-controls={"audit-details-" + event.id} onClick={() => toggleEvent(event.id)}><ChevronDown aria-hidden="true" /></button>
            </div>
            {expanded ? <div className={styles.eventDetails} id={"audit-details-" + event.id}>
              <dl>
                <div><dt>Resource</dt><dd>{resourceName ?? resourceTitle(event.resource_type)}</dd></div>
                <div><dt>Actor</dt><dd>{actorName ?? (event.actor_user_id ? "Recorded user" : "System")}</dd></div>
                <Identifier label="Resource ID" value={event.resource_id} onCopy={(value) => void copyId(value)} />
                <Identifier label="Actor ID" value={event.actor_user_id} onCopy={(value) => void copyId(value)} />
                <Identifier label="Correlation ID" value={event.correlation_id} onCopy={(value) => void copyId(value)} />
                <Identifier label="Event ID" value={event.id} onCopy={(value) => void copyId(value)} />
                <div><dt>Raw event</dt><dd className={styles.rawValue}>{event.event_type}</dd></div>
                <div><dt>Exact time</dt><dd>{new Date(event.created_at).toLocaleString()}</dd></div>
              </dl>
              {event.reason ? <p className={styles.reason}><strong>Reason</strong> {event.reason}</p> : null}
              {Object.keys(event.details).length ? <details className={styles.metadata}><summary>View safe metadata</summary><pre>{JSON.stringify(event.details, null, 2)}</pre></details> : null}
            </div> : null}
          </article>
        </li>;
      })}</ol> : <div className={styles.statePanel}><h2>No events match this page search.</h2><p>Try another term or move to a different page.</p><button type="button" onClick={() => setSearch("")}>Clear page search</button></div>}
      <nav className={styles.pagination} aria-label="Audit pagination">
        <button type="button" disabled={pageNumber === 1} onClick={() => setPageNumber((value) => value - 1)}><ChevronLeft aria-hidden="true" /> Previous</button>
        <div>{paginationItems(pageNumber, totalPages).map((item, index) => item === null ? <span key={"gap-" + index} aria-hidden="true">…</span> : <button type="button" key={item} aria-label={"Page " + item} aria-current={item === pageNumber ? "page" : undefined} onClick={() => setPageNumber(item)}>{item}</button>)}</div>
        <button type="button" disabled={pageNumber >= totalPages} onClick={() => setPageNumber((value) => value + 1)}>Next <ChevronRight aria-hidden="true" /></button>
      </nav>
    </section> : null}
  </main>;
}
