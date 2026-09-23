"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, ClipboardCheck, MessageSquareText, RefreshCcw } from "lucide-react";

import { ContentGrid, PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Alert, Badge } from "@/components/ui/feedback";
import { apiRequest } from "@/lib/api/client";
import styles from "./admin-overview.module.css";

type QueueCount = { total: number };

export function ReviewerDashboard() {
  const [assigned, setAssigned] = useState(0);
  const [responses, setResponses] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const results = await Promise.allSettled([
      apiRequest<QueueCount>("/tnp/recruitment/review-queue?work_view=my_work&page_size=1", { cache: "no-store" }),
      apiRequest<QueueCount>("/tnp/recruitment/review-queue?requests=awaiting_review&page_size=1", { cache: "no-store" }),
      apiRequest<QueueCount>("/tnp/recruitment/review-queue?work_view=overdue&page_size=1", { cache: "no-store" }),
    ]);
    if (results[0].status === "fulfilled") setAssigned(results[0].value.total);
    if (results[1].status === "fulfilled") setResponses(results[1].value.total);
    if (results[2].status === "fulfilled") setOverdue(results[2].value.total);
    if (results.some(result => result.status === "rejected")) {
      setError("Some assigned-work counts are temporarily unavailable. Your review queue remains available.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  return (
    <PageContainer context="admin" className={styles.page} aria-busy={loading}>
      <PageHeader
        eyebrow="Assigned review"
        title={loading ? "Loading assigned work…" : assigned ? `${assigned} assigned ${assigned === 1 ? "case" : "cases"}.` : "Your assigned queue is clear."}
        description="Review only the cases assigned to you. Approved placement policies explain the basis for each decision."
        actions={<button className={styles.refresh} type="button" onClick={() => void load()}><RefreshCcw aria-hidden="true" />Refresh</button>}
      />
      {error && <Alert tone="warning">{error}</Alert>}
      <section className={styles.quickActions} aria-labelledby="reviewer-actions-title">
        <header><div><p>Next action</p><h2 id="reviewer-actions-title">Continue accountable review</h2></div><Badge tone={overdue ? "warning" : "success"}>{overdue ? `${overdue} overdue` : "On track"}</Badge></header>
        <nav aria-label="Reviewer quick actions">
          <Link href="/tnp/applications?work_view=my_work"><ClipboardCheck aria-hidden="true" /><span><strong>Open assigned reviews</strong><small>Student records and permitted decisions</small></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/tnp/applications?requests=awaiting_review"><MessageSquareText aria-hidden="true" /><span><strong>Review student responses</strong><small>{responses} waiting for review</small></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/tnp/policies"><CircleAlert aria-hidden="true" /><span><strong>Consult approved policies</strong><small>Read-only decision guidance</small></span><ArrowRight aria-hidden="true" /></Link>
        </nav>
      </section>
      <ContentGrid className={styles.summaryGrid} variant="focused" aria-label="Assigned review summary">
        <article className={styles.primary}><div className={styles.primaryLabel}><ClipboardCheck aria-hidden="true" /><p>Assigned cases</p></div><div><h2>{assigned}</h2><span>applications currently assigned to you</span></div><Link href="/tnp/applications?work_view=my_work">Open review queue</Link></article>
        <article className={styles.snapshot}><header><p>Attention</p><h2>Review timing</h2></header><dl><div className={styles.metricRow}><dt><CircleAlert aria-hidden="true" /><span>Overdue reviews</span><small>Due date has passed</small></dt><dd><span>{overdue}</span></dd></div><div className={styles.metricRow}><dt><MessageSquareText aria-hidden="true" /><span>Responses received</span><small>Student clarification available</small></dt><dd><span>{responses}</span></dd></div></dl></article>
      </ContentGrid>
    </PageContainer>
  );
}
