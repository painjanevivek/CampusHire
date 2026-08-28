"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Badge, RequestState } from "@/components/ui/feedback";
import { ApiError, apiRequest, csrfRequest } from "@/lib/api/client";
import styles from "./admin-students.module.css";

type User = { institution_id: string };
type Membership = { id: string; email?: string; role: string; status: string };
type RosterRow = { row_number: number; email?: string; enrollment_id?: string; full_name?: string; status: string; errors: string[]; activation_token?: string };
type RosterImport = { id: string; status: string; total_rows: number; valid_rows: number; invalid_rows: number; invited_rows: number; rows: RosterRow[] };

export function AdminStudents() {
  const [institutionId, setInstitutionId] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [roster, setRoster] = useState<RosterImport | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const me = await apiRequest<User>("/auth/me", { cache: "no-store" });
      const records = await apiRequest<Membership[]>(`/institutions/${me.institution_id}/memberships`, { cache: "no-store" });
      setInstitutionId(me.institution_id);
      setMemberships(records);
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
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : "The valid roster rows could not be committed.");
    }
  }

  if (state === "loading") return <main className={styles.page}><RequestState state="loading" title="Loading student records">Checking the institution roster and membership states.</RequestState></main>;
  if (state === "error") return <main className={styles.page}><RequestState state="error" title="Student records are unavailable" onRetry={() => void load()}>{message}</RequestState></main>;

  return (
    <main id="main-content" className={styles.page}>
      <header><div><p className="eyebrow">Verified enrollment</p><h1>Students</h1><span>Preview every roster row before creating single-use invitations.</span></div><label className={styles.upload}>Preview CSV<input className="srOnly" type="file" accept=".csv,text/csv" onChange={(event) => void preview(event)} /></label></header>
      {message ? <Alert tone={message.includes("created") ? "success" : "error"}>{message}</Alert> : null}
      {roster ? <section className={styles.roster} aria-labelledby="roster-title"><header><div><h2 id="roster-title">Roster preview</h2><p>{roster.valid_rows} valid · {roster.invalid_rows} need correction · {roster.invited_rows} invited</p></div>{roster.status !== "committed" ? <Button onClick={() => void commit()} disabled={!roster.valid_rows}>Invite valid rows</Button> : <Badge tone="success">Committed</Badge>}</header><div className={styles.table} role="table" aria-label="Roster row results">{roster.rows.map((row) => <div role="row" key={row.row_number}><span role="cell">{row.row_number}</span><span role="cell"><strong>{row.full_name || "Unnamed row"}</strong><small>{row.email}</small></span><span role="cell">{row.enrollment_id}</span><span role="cell"><Badge tone={row.status === "invited" || row.status === "valid" ? "success" : "warning"}>{row.status}</Badge>{row.errors.length ? <small>{row.errors.join(", ")}</small> : null}</span>{row.activation_token ? <code role="cell" aria-label={`One-time token for ${row.email}`}>{row.activation_token}</code> : null}</div>)}</div></section> : null}
      <section className={styles.directory} aria-labelledby="directory-title"><header><h2 id="directory-title">Membership directory</h2><Badge>{memberships.length} records</Badge></header>{memberships.length ? <div className={styles.table} role="table">{memberships.map((membership) => <div role="row" key={membership.id}><span role="cell"><strong>{membership.email ?? "Account pending"}</strong></span><span role="cell">{membership.role.replaceAll("_", " ")}</span><span role="cell"><Badge tone={membership.status === "active" ? "success" : "warning"}>{membership.status}</Badge></span></div>)}</div> : <RequestState state="empty" title="No memberships yet">Upload a roster to create the first student invitations.</RequestState>}</section>
    </main>
  );
}
