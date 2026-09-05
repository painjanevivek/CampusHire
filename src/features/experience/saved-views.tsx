"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { csrfRequest } from "@/lib/api/client";
import { useResource } from "./use-resource";
import styles from "./experience.module.css";

type SavedView = { id: string; name: string; filters: Record<string, string> };
export function SavedViews({ query }: { query: string }) {
  const views = useResource<SavedView[]>("/opportunity-views");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>, item?: SavedView) {
    event.preventDefault(); const form = event.currentTarget;
    const allowed = new Set(["q", "location", "work_mode", "skill", "eligibility", "application_state", "deadline_within_days", "saved_only", "sort"]);
    const filters = Object.fromEntries([...new URLSearchParams(query)].filter(([key]) => allowed.has(key)));
    setBusy(true); setError("");
    try { await csrfRequest(`/opportunity-views${item ? `/${item.id}` : ""}`, { method: item ? "PUT" : "POST", body: JSON.stringify({ name: new FormData(form).get("name"), filters }) }); form.reset(); views.refresh(); }
    catch { setError("The view could not be saved. Keep at most 20 named views and use supported filters."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true); setError("");
    try { await csrfRequest(`/opportunity-views/${id}`, { method: "DELETE" }); views.refresh(); }
    catch { setError("The saved view could not be removed."); } finally { setBusy(false); }
  }
  return <details className={styles.panel}><summary>Saved filter views</summary><p>Only your filter preferences are stored, for your current institution. Role details remain live.</p>
    {(error || views.error) && <p role="alert">{error || views.error} <button onClick={views.refresh}>Retry</button></p>}
    <form className={styles.toolbar} onSubmit={event => void save(event)}><label>View name<input name="name" required maxLength={80} /></label><button className={styles.button} disabled={busy}>Save current filters</button></form>
    {views.data?.map(item => <article key={item.id}><p><Link href={`/opportunities?${new URLSearchParams(item.filters)}`}>{item.name}</Link></p><details><summary>Edit saved view</summary><form className={styles.toolbar} onSubmit={event => void save(event, item)}><label>View name<input name="name" defaultValue={item.name} required maxLength={80} /></label><button className={styles.button} disabled={busy}>Replace with current filters</button><button className={styles.button} type="button" disabled={busy} onClick={() => void remove(item.id)}>Remove saved view</button></form></details></article>)}
  </details>;
}
