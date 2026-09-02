"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { ApiError, apiPath, apiRequest, csrfRequest } from "@/lib/api/client";
import { InvitationQueue } from "./invitation-queue";
import styles from "./admin-students.module.css";

type User = { id: string; institution_id: string };
type Membership = { id: string; user_id: string; email?: string; role: string; status: string };
type MembershipPage = { items: Membership[]; page: number; page_size: number; total: number };
type RosterRow = { row_number: number; email?: string; enrollment_id?: string; full_name?: string; status: string; errors: string[] };
type RosterImport = { id: string; status: string; total_rows: number; valid_rows: number; invalid_rows: number; invited_rows: number; rows: RosterRow[] };
type RosterSummary = Omit<RosterImport, "rows"> & { filename: string; committed_at: string | null; created_at: string };
const pageSize = 20;

export function AdminStudents() {
  const [institutionId, setInstitutionId] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipTotal, setMembershipTotal] = useState(0);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [roster, setRoster] = useState<RosterImport | null>(null);
  const [history, setHistory] = useState<RosterSummary[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<"email" | "status">("email");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const me = await apiRequest<User>("/auth/me", { cache: "no-store" });
      const [records, imports] = await Promise.all([
        apiRequest<MembershipPage>(`/institutions/${me.institution_id}/memberships?role=student&page=1&page_size=${pageSize}`, { cache: "no-store" }),
        apiRequest<RosterSummary[]>(`/institutions/${me.institution_id}/roster-imports`, { cache: "no-store" }),
      ]);
      setInstitutionId(me.institution_id);
      window.localStorage.removeItem("campushire.admin.students-view");
      setMemberships(records.items);
      setMembershipTotal(records.total);
      setHistory(imports);
      setState("ready");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The student directory could not be loaded.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const loadDirectory = useCallback(async (signal?: AbortSignal) => {
    if (!institutionId) return;
    setDirectoryLoading(true);
    const params = new URLSearchParams({
      role: "student",
      sort,
      page: String(page),
      page_size: String(pageSize),
    });
    if (query.trim()) params.set("query", query.trim());
    if (statusFilter) params.set("membership_status", statusFilter);
    try {
      const records = await apiRequest<MembershipPage>(
        `/institutions/${institutionId}/memberships?${params.toString()}`,
        { cache: "no-store", signal },
      );
      const lastPage = Math.max(1, Math.ceil(records.total / pageSize));
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }
      setMemberships(records.items);
      setMembershipTotal(records.total);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setMessage(cause instanceof ApiError ? cause.message : "The student directory could not be refreshed.");
    } finally {
      if (!signal?.aborted) setDirectoryLoading(false);
    }
  }, [institutionId, page, query, sort, statusFilter]);

  useEffect(() => {
    if (!institutionId) return;
    const controller = new AbortController();
    const pending = window.setTimeout(() => void loadDirectory(controller.signal), query ? 250 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(pending);
    };
  }, [institutionId, loadDirectory, query]);

  async function preview(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !institutionId) return;
    const form = new FormData();
    form.set("file", file);
    setMessage("");
    try {
      setRoster(await csrfRequest<RosterImport>(`/institutions/${institutionId}/roster-imports/preview`, { method: "POST", body: form }));
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The roster could not be previewed.");
    } finally {
      event.target.value = "";
    }
  }

  async function commit() {
    if (!roster) return;
    setMessage("");
    try {
      const result = await csrfRequest<RosterImport>(`/institutions/${institutionId}/roster-imports/${roster.id}/commit`, { method: "POST" });
      setRoster(result);
      setMessage(`${result.invited_rows} invitation${result.invited_rows === 1 ? "" : "s"} created.`);
      await load();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The valid roster rows could not be committed.");
    }
  }

  async function changeMembership(event: FormEvent<HTMLFormElement>, membershipId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const updated = await csrfRequest<Membership>(`/institutions/${institutionId}/memberships/${membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: form.get("status"), reason: form.get("reason") }),
      });
      setMemberships((items) => items.map((item) => item.id === membershipId ? { ...item, ...updated, email: item.email } : item));
      setMessage("Membership status updated and recorded in Audit.");
      await loadDirectory();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The membership status was not changed.");
    }
  }

  async function currentSavedViewKey() {
    const me = await apiRequest<User>("/auth/me", { cache: "no-store" });
    return `campushire.admin.students-view.${me.id}.${me.institution_id}`;
  }

  async function saveView() {
    try {
      const key = await currentSavedViewKey();
      window.sessionStorage.setItem(key, JSON.stringify({ query, statusFilter, sort }));
      setMessage("Student directory view saved for this signed-in session.");
    } catch {
      setMessage("The signed-in account could not be verified, so the view was not saved.");
    }
  }

  async function restoreView() {
    try {
      const key = await currentSavedViewKey();
      const stored = window.sessionStorage.getItem(key);
      if (!stored) return setMessage("No saved student view exists in this session.");
      const restored = JSON.parse(stored) as { query?: string; statusFilter?: string; sort?: "email" | "status" };
      setQuery(restored.query ?? ""); setStatusFilter(restored.statusFilter ?? ""); setSort(restored.sort ?? "email"); setPage(1);
      setMessage("Saved student directory view restored for this account.");
    } catch { setMessage("The saved student view is invalid and was not applied."); }
  }

  if (state === "loading") return <main className={styles.page}><RequestState state="loading" title="Loading student records">Checking the institution roster and membership states.</RequestState></main>;
  if (state === "error") return <main className={styles.page}><RequestState state="error" title="Student records are unavailable" onRetry={() => void load()}>{message}</RequestState></main>;

  return (
    <main id="main-content" className={styles.page}>
      <header><div><p className="eyebrow">Verified enrollment</p><h1>Students</h1><span>Preview every roster row before creating single-use invitations.</span></div><div className={styles.headerActions}><a href={apiPath(`/institutions/${institutionId}/roster-imports/template`)} download>Download template</a><a href={apiPath(`/institutions/${institutionId}/memberships/export.csv?role=student`)} download>Export safe CSV</a><label className={styles.upload}>Preview CSV<input className="srOnly" type="file" accept=".csv,text/csv" onChange={(event) => void preview(event)} /></label></div></header>
      {message ? <Alert tone={message.includes("created") ? "success" : "error"}>{message}</Alert> : null}
      {roster ? <section className={styles.roster} aria-labelledby="roster-title"><header><div><h2 id="roster-title">Roster preview</h2><p>{roster.valid_rows} valid · {roster.invalid_rows} need correction · {roster.invited_rows} invited</p></div>{roster.status !== "committed" ? <Button onClick={() => void commit()} disabled={!roster.valid_rows}>Invite valid rows</Button> : <Badge tone="success">Committed</Badge>}</header><div className={styles.table} role="table" aria-label="Roster row results">{roster.rows.map((row) => <div role="row" key={row.row_number}><span role="cell">{row.row_number}</span><span role="cell"><strong>{row.full_name || "Unnamed row"}</strong><small>{row.email}</small></span><span role="cell">{row.enrollment_id}</span><span role="cell"><Badge tone={row.status === "invited" || row.status === "valid" ? "success" : "warning"}>{row.status}</Badge>{row.errors.length ? <small>{row.errors.join(", ")}</small> : null}</span></div>)}</div></section> : null}
      <InvitationQueue institutionId={institutionId} />
      <section className={styles.directory} aria-labelledby="directory-title" aria-busy={directoryLoading}><header><div><h2 id="directory-title">Student directory</h2><p>{membershipTotal} matching student record{membershipTotal === 1 ? "" : "s"}</p></div><Badge>{membershipTotal} records</Badge></header><div className={styles.controls}><label>Search<input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Email or user ID" /></label><label>Status<select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="invited">Invited</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option><option value="graduated">Graduated</option></select></label><label>Sort<select value={sort} onChange={(event) => { setSort(event.target.value as "email" | "status"); setPage(1); }}><option value="email">Email</option><option value="status">Status</option></select></label><button type="button" onClick={() => void saveView()}>Save view</button><button type="button" onClick={() => void restoreView()}>Restore</button></div>{memberships.length ? <><div className={styles.table} role="table">{memberships.map((membership) => <div role="row" key={membership.id}><span role="cell"><strong>{membership.email ?? "Account pending"}</strong><small>{membership.user_id}</small></span><span role="cell">Student</span><span role="cell"><Badge tone={membership.status === "active" ? "success" : "warning"}>{membership.status}</Badge><details><summary>Change status</summary><form onSubmit={(event) => void changeMembership(event, membership.id)}><select name="status" defaultValue={membership.status}><option value="active">Active</option><option value="suspended">Suspended</option><option value="revoked">Revoked</option><option value="graduated">Graduated</option></select><input name="reason" required minLength={10} maxLength={500} placeholder="Accountable reason for audit" /><button type="submit">Confirm</button></form></details></span></div>)}</div><nav className={styles.pagination} aria-label="Student directory pages"><button disabled={page === 1 || directoryLoading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(membershipTotal / pageSize))}</span><button disabled={page * pageSize >= membershipTotal || directoryLoading} onClick={() => setPage((value) => value + 1)}>Next</button></nav></> : <RequestState state={directoryLoading ? "loading" : "empty"} title={directoryLoading ? "Loading student records" : membershipTotal ? "No students on this page" : "No students match"}>{directoryLoading ? "Applying the current institution filters." : "Clear the filters or upload a roster to add students."}</RequestState>}</section>
      <section className={styles.history} aria-labelledby="history-title"><header><h2 id="history-title">Roster import history</h2><Badge>{history.length} imports</Badge></header>{history.length ? <ol>{history.map((item) => <li key={item.id}><div><strong>{item.filename}</strong><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div><span>{item.valid_rows} valid · {item.invalid_rows} invalid · {item.invited_rows} invited</span><Badge tone={item.status === "committed" ? "success" : "warning"}>{item.status}</Badge></li>)}</ol> : <RequestState state="empty" title="No roster imports yet">Preview a validated CSV to begin a traceable import.</RequestState>}</section>
    </main>
  );
}
