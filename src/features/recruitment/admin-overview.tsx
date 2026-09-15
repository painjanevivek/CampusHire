"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CircleAlert, ClipboardCheck, FileClock, RefreshCcw, UserPlus } from "lucide-react";

import { ContentGrid, PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Alert, Badge } from "@/components/ui/feedback";
import { apiRequest } from "@/lib/api/client";
import type { Company, Drive } from "./types";
import styles from "./admin-overview.module.css";

type Funnel = { metrics: Array<{ event_name: string; count: number }>; window_days: number };

export function AdminOverview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [funnel, setFunnel] = useState<Funnel>({ metrics: [], window_days: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try {
      const results = await Promise.allSettled([
        apiRequest<Company[]>("/tnp/recruitment/companies", { cache: "no-store" }),
        apiRequest<Drive[]>("/tnp/recruitment/drives", { cache: "no-store" }),
        apiRequest<{ total: number }>("/tnp/recruitment/review-queue?review_pending=true&page_size=1", { cache: "no-store" }),
        apiRequest<{ total: number }>("/tnp/recruitment/review-queue?requests=awaiting_review&page_size=1", { cache: "no-store" }),
        apiRequest<Funnel>("/admin/analytics/funnel?window_days=30", { cache: "no-store" }),
      ]);
      if (results[0].status === "fulfilled") setCompanies(results[0].value);
      if (results[1].status === "fulfilled") setDrives(results[1].value);
      if (results[2].status === "fulfilled") setReviewCount(results[2].value.total);
      if (results[3].status === "fulfilled") setResponseCount(results[3].value.total);
      if (results[4].status === "fulfilled") setFunnel(results[4].value);
      if (results.some(result => result.status === "rejected")) {
        setError("Some dashboard summaries are temporarily unavailable. Available sections remain current; use their links to retry the affected workspace.");
      }
    } catch { setError("The operations summary could not be refreshed. Open each workspace to retry its data independently."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const publishedDrives = drives.filter((item) => item.status === "published").length;
  const activationCount = funnel.metrics.find((item) => item.event_name === "invitation_accepted")?.count ?? 0;

  return (
    <PageContainer context="admin" className={styles.page} aria-busy={loading}>
      <PageHeader
        eyebrow="T&P control room"
        title={loading ? "Loading operations…" : reviewCount ? `${reviewCount} ${reviewCount === 1 ? "application needs" : "applications need"} review.` : "Placement operations are clear."}
        description="Only live college records are shown. AI issues never block drives, eligibility, or applications."
        actions={(
          <button className={styles.refresh} type="button" onClick={() => void load()}>
            <RefreshCcw aria-hidden="true" />Refresh
          </button>
        )}
      />
      {error && <Alert tone="error">{error}</Alert>}
      <section className={styles.quickActions} aria-labelledby="quick-actions-title">
        <header>
          <div><p>Quick actions</p><h2 id="quick-actions-title">Start common work</h2></div>
          <span>Three direct paths; full controls stay in their workspaces.</span>
        </header>
        <nav aria-label="Dashboard quick actions">
          <Link href="/tnp/applications?work_view=my_work"><ClipboardCheck aria-hidden="true" /><span><strong>Review applications</strong><small>Open your assigned work</small></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/tnp/drives"><FileClock aria-hidden="true" /><span><strong>Manage drives</strong><small>Publish or update a drive</small></span><ArrowRight aria-hidden="true" /></Link>
          <Link href="/tnp/students"><UserPlus aria-hidden="true" /><span><strong>Invite students</strong><small>Preview a verified roster</small></span><ArrowRight aria-hidden="true" /></Link>
        </nav>
      </section>
      <ContentGrid className={styles.summaryGrid} variant="focused" aria-label="Placement operations summary">
        <article className={styles.primary}>
          <div className={styles.primaryLabel}>
            <ClipboardCheck aria-hidden="true" />
            <p>Review queue</p>
          </div>
          <div>
            <h2>{reviewCount}</h2>
            <span>applications waiting for a placement decision</span>
          </div>
          <p className={styles.reviewDetail}>{responseCount} applications with a student response to review</p>
          <Link href="/tnp/applications?work_view=my_work">Open assigned review</Link>
        </article>

        <article className={styles.snapshot}>
          <header>
            <p>Operating snapshot</p>
            <h2>Live placement activity</h2>
          </header>
          <dl>
            <div className={styles.metricRow}>
                <dt><FileClock aria-hidden="true" /><span>Published drives</span><small>{drives.length - publishedDrives} not currently live</small></dt>
                <dd><span>{publishedDrives}</span><Link href="/tnp/drives">Manage</Link></dd>
            </div>
            <div className={styles.metricRow}>
                <dt><Building2 aria-hidden="true" /><span>Company records</span><small>Institution-scoped employers</small></dt>
                <dd><span>{companies.length}</span><Link href="/tnp/companies">Manage</Link></dd>
            </div>
            <div className={styles.metricRow}>
                <dt><CircleAlert aria-hidden="true" /><span>Invitations accepted</span><small>Combined 30-day total</small></dt>
                <dd><span>{activationCount}</span><Badge tone="success">Private</Badge></dd>
            </div>
          </dl>
        </article>
      </ContentGrid>
    </PageContainer>
  );
}
