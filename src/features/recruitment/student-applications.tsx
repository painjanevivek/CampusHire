"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileLock2 } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { cachedApiRequest } from "@/lib/api/client";
import type { PlacementApplication } from "./types";
import styles from "./student-applications.module.css";

const formatDate = (value: string, timeZone: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone,
}).format(new Date(value));

export function StudentApplications() {
  const [items, setItems] = useState<PlacementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    try {
      setItems(await cachedApiRequest<PlacementApplication[]>("/applications", { force }));
      setError("");
    } catch {
      setError("Applications could not be refreshed. Your submitted records are unchanged.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  return (
    <main id="main-content" className={styles.page} data-navigation-ready={!loading && !error}>
      <header><div><p>Applications</p><h1>Your decision record.</h1><span>Every submission keeps its selected resume, eligibility result, and policy version.</span></div><strong>{items.length}</strong></header>
      {error ? <Alert tone="warning">{error} <button type="button" onClick={() => void load(true)}>Retry</button></Alert> : null}
      {loading ? <p role="status">Loading application history…</p> : !items.length ? (
        <section className={styles.empty}><FileLock2 aria-hidden="true" /><h2>No applications yet</h2><p>Review an eligible institution-published role, select a clean resume version, and confirm your submission.</p><Link href="/opportunities">Explore opportunities <ArrowRight size={17} aria-hidden="true" /></Link></section>
      ) : <ol className={styles.list}>{items.map((item) => {
        const role = item.role_snapshot as { title?: string; company_name?: string; deadline?: string };
        return <li key={item.id}><div><p>{role.company_name ?? "Published opportunity"}</p><h2><Link href={`/applications/${item.id}`}>{role.title ?? "Placement application"}</Link></h2><span>Submitted {formatDate(item.created_at, item.institution_timezone)} · {item.institution_timezone}</span><details><summary>View status history</summary><ol>{item.history.map((event) => <li key={event.id}><strong>{event.to_status.replaceAll("_", " ")}</strong><span>{formatDate(event.created_at, item.institution_timezone)}{event.reason ? ` · ${event.reason}` : ""}</span></li>)}</ol></details></div><div><strong data-status={item.status}>{item.status.replaceAll("_", " ")}</strong><small>Resume v{String(item.resume_snapshot.version_number ?? "—")} · Rule v{String(item.rule_snapshot.version ?? "—")}</small><Link href={`/applications/${item.id}`}>Open application</Link></div></li>;
      })}</ol>}
    </main>
  );
}
