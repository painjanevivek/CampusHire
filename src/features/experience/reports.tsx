"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Alert } from "@/components/ui/feedback";
import type { Drive } from "@/features/recruitment/types";
import { safeInternalHref } from "@/lib/navigation";
import { useResource } from "./use-resource";
import styles from "./experience.module.css";

type Report = { start_at: string; end_at: string; timezone: string; metrics: Array<{ key: string; label: string; value: number | null; sample_size: number; explanation: string; href: string }> };
export function Reports() {
  const [query, setQuery] = useState("");
  const report = useResource<Report>(`/admin/recruitment/reports${query ? `?${query}` : ""}`);
  const drives = useResource<Drive[]>("/admin/recruitment/drives");
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const params = new URLSearchParams();
    for (const key of ["start_at", "end_at"]) if (data.get(key)) params.set(key, new Date(String(data.get(key))).toISOString());
    if (data.get("drive_id")) params.set("drive_id", String(data.get("drive_id")));
    setQuery(params.toString());
  }
  return <PageContainer context="admin" className={styles.stack}>
    <PageHeader eyebrow="Institution reporting" title="Placement operations, from recorded facts." description="Default: applications submitted during the last 30 days. Every measure explains its calculation and links to the source records." />
    <form className={styles.toolbar} onSubmit={filter}><label>From (your local time)<input name="start_at" type="datetime-local" /></label><label>Until, exclusive (your local time)<input name="end_at" type="datetime-local" /></label><label>Drive<select name="drive_id"><option value="">All drives</option>{drives.data?.map(drive => <option key={drive.id} value={drive.id}>{drive.title}</option>)}</select></label><button className={styles.button}>Apply report filters</button></form>
    {report.error && <Alert tone="error">{report.error} Choose a valid interval of up to 366 days. <button onClick={report.refresh}>Retry</button></Alert>}
    {report.loading && <p role="status">Calculating authoritative summaries…</p>}
    {report.data && <section aria-label="Operational report" aria-busy={report.loading} className={styles.stack}>
      <p>{new Date(report.data.start_at).toLocaleString(undefined, { timeZone: report.data.timezone })} to {new Date(report.data.end_at).toLocaleString(undefined, { timeZone: report.data.timezone })} ({report.data.timezone}; end exclusive)</p>
      <div className={styles.metrics}>{report.data.metrics.map(metric => <article key={metric.key} className={styles.panel}><h2>{metric.label}</h2><div className={styles.metric}>{metric.value === null ? "No data" : metric.value.toLocaleString()}</div><p>{metric.explanation}</p><p>Sample: {metric.sample_size}</p><Link className={styles.button} href={safeInternalHref(metric.href, "/admin/applications")}>View source records</Link></article>)}</div>
    </section>}
  </PageContainer>;
}
