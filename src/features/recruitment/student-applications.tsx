"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, CalendarDays, ChevronDown, CircleCheck, CircleMinus, CircleX, Clock3, FileLock2, FileText, History, ShieldCheck } from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { cachedApiRequest } from "@/lib/api/client";
import type { PlacementApplication } from "./types";
import styles from "./student-applications.module.css";

const formatDate = (value: string, timeZone: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone,
}).format(new Date(value));

const statusLabel = (status: string) => {
  const label = status.replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function StatusIcon({ status }: { status: string }) {
  const Icon = status === "shortlisted" ? BadgeCheck : status === "offered" ? CircleCheck
    : status === "interview" ? CalendarDays : status === "rejected" ? CircleX
    : status === "withdrawn" ? CircleMinus : Clock3;
  return <Icon size={15} aria-hidden="true" />;
}

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
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Applications</p><h1>Your applications.</h1><span>Every submission keeps its selected resume, eligibility result, and policy version.</span></div>
        {!loading && !error && <span className={styles.count}><FileLock2 size={17} aria-hidden="true" />{items.length} {items.length === 1 ? "application" : "applications"}</span>}
      </header>
      {error ? <Alert tone="warning">{error} <button type="button" onClick={() => void load(true)}>Retry</button></Alert> : null}
      {loading && <p role="status" className={styles.loading}>Loading application history…</p>}
      {!loading && !error && !items.length ? (
        <section className={styles.empty}><FileLock2 aria-hidden="true" /><h2>No applications yet</h2><p>Review an eligible institution-published role, select a clean resume version, and confirm your submission.</p><Link href="/opportunities">Explore opportunities <ArrowRight size={17} aria-hidden="true" /></Link></section>
      ) : items.length > 0 ? <ol className={styles.list} aria-label="Your applications" aria-busy={loading}>{items.map((item) => {
        const role = item.role_snapshot as { title?: string; company_name?: string };
        const title = role.title ?? "Placement application";
        const company = role.company_name ?? "Published opportunity";
        return <li key={item.id}>
          <article className={styles.card} aria-label={`${title} at ${company}`}>
            <div className={styles.cardHeading}>
              <div className={styles.company}><span className={styles.companyIcon}><Building2 size={20} aria-hidden="true" /></span><span>{company}</span></div>
              <span className={styles.status} data-status={item.status}><StatusIcon status={item.status} />{statusLabel(item.status)}</span>
            </div>
            <h2><Link href={`/applications/${item.id}`}>{title}</Link></h2>
            <p className={styles.submitted}><CalendarDays size={15} aria-hidden="true" /><span>Submitted <time dateTime={item.created_at}>{formatDate(item.created_at, item.institution_timezone)}</time><small>{item.institution_timezone}</small></span></p>
            <div className={styles.versions} aria-label="Saved submission versions">
              <span><FileText size={15} aria-hidden="true" />Resume v{String(item.resume_snapshot.version_number ?? "—")}</span>
              <span><ShieldCheck size={15} aria-hidden="true" />Rule v{String(item.rule_snapshot.version ?? "—")}</span>
            </div>
            {item.next_step && <p className={styles.guidance} data-action={item.next_actor === "student"}>{item.next_step}</p>}
            <div className={styles.cardFooter}>
              <details className={styles.history}>
                <summary><History size={16} aria-hidden="true" /><span>View status history</span><ChevronDown size={15} aria-hidden="true" /></summary>
                {item.history.length ? <ol>{item.history.map((event) => <li key={event.id}>
                  <span className={styles.eventStatus}>{statusLabel(event.to_status)}</span>
                  <time dateTime={event.created_at}>{formatDate(event.created_at, item.institution_timezone)}</time>
                  {event.reason && <p>{event.reason}</p>}
                </li>)}</ol> : <p>No status updates recorded yet.</p>}
              </details>
              <Link className={styles.openApplication} href={`/applications/${item.id}`} aria-label={`Open application for ${title} at ${company}`}>Open application<ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </article>
        </li>;
      })}</ol> : null}
    </main>
  );
}
