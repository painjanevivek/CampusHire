"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CircleAlert, ClipboardCheck, FileClock, RefreshCcw } from "lucide-react";

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
      const [companyData, driveData, applicationData, responseData, funnelData] = await Promise.all([
        apiRequest<Company[]>("/admin/recruitment/companies", { cache: "no-store" }),
        apiRequest<Drive[]>("/admin/recruitment/drives", { cache: "no-store" }),
        apiRequest<{ total: number }>("/admin/recruitment/review-queue?review_pending=true&page_size=1", { cache: "no-store" }),
        apiRequest<{ total: number }>("/admin/recruitment/review-queue?requests=awaiting_review&page_size=1", { cache: "no-store" }),
        apiRequest<Funnel>("/admin/analytics/funnel?window_days=30", { cache: "no-store" }),
      ]);
      setCompanies(companyData); setDrives(driveData); setReviewCount(applicationData.total); setResponseCount(responseData.total); setFunnel(funnelData);
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
        title={loading ? "Loading operations…" : reviewCount ? `${reviewCount} applications need review.` : "Placement operations are clear."}
        description="Only live college records are shown. AI issues never block drives, eligibility, or applications."
        actions={(
          <button className={styles.refresh} type="button" onClick={() => void load()}>
            <RefreshCcw aria-hidden="true" />Refresh
          </button>
        )}
      />
      {error && <Alert tone="error">{error}</Alert>}
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
          <Link href="/admin/applications?review_pending=true">Open candidate review</Link>
        </article>

        <article className={styles.snapshot}>
          <header>
            <p>Operating snapshot</p>
            <h2>Live placement activity</h2>
          </header>
          <dl>
            <div className={styles.metricRow}>
                <dt><FileClock aria-hidden="true" /><span>Published drives</span><small>{drives.length - publishedDrives} not currently live</small></dt>
                <dd><span>{publishedDrives}</span><Link href="/admin/drives">Manage</Link></dd>
            </div>
            <div className={styles.metricRow}>
                <dt><Building2 aria-hidden="true" /><span>Company records</span><small>Institution-scoped employers</small></dt>
                <dd><span>{companies.length}</span><Link href="/admin/companies">Manage</Link></dd>
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
