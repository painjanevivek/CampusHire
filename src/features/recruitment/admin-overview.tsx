"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CircleAlert, ClipboardCheck, FileClock, RefreshCcw } from "lucide-react";

import { ContentGrid, PageContainer, PageHeader } from "@/components/layout/page-layout";
import { Alert, Badge } from "@/components/ui/feedback";
import { apiRequest } from "@/lib/api/client";
import type { AdminApplicationPage, Company, Drive, PlacementApplication } from "./types";
import styles from "./admin-overview.module.css";

type Funnel = { metrics: Array<{ event_name: string; count: number }>; window_days: number };

export function AdminOverview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [funnel, setFunnel] = useState<Funnel>({ metrics: [], window_days: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try {
      const [companyData, driveData, applicationData, funnelData] = await Promise.all([
        apiRequest<Company[]>("/admin/recruitment/companies", { cache: "no-store" }),
        apiRequest<Drive[]>("/admin/recruitment/drives", { cache: "no-store" }),
        apiRequest<AdminApplicationPage>("/admin/recruitment/applications?page=1&page_size=50", { cache: "no-store" }),
        apiRequest<Funnel>("/admin/analytics/funnel?window_days=30", { cache: "no-store" }),
      ]);
      setCompanies(companyData); setDrives(driveData); setApplications(applicationData.items); setFunnel(funnelData);
    } catch { setError("The operations summary could not be refreshed. Open each workspace to retry its data independently."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  const reviewCount = useMemo(() => applications.filter((item) => ["submitted", "under_review"].includes(item.status)).length, [applications]);
  const manualReviewCount = useMemo(() => applications.filter((item) => item.eligibility_snapshot.status === "needs_manual_review").length, [applications]);
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
          <p className={styles.reviewDetail}>{manualReviewCount} with missing information</p>
          <Link href="/admin/applications">Open candidate review</Link>
        </article>

        <article className={styles.snapshot}>
          <header>
            <p>Operating snapshot</p>
            <h2>Live placement activity</h2>
          </header>
          <dl>
            <div className={styles.metricRow}>
              <FileClock aria-hidden="true" />
              <dt><span>Published drives</span><small>{drives.length - publishedDrives} not currently live</small></dt>
              <dd>{publishedDrives}</dd>
              <Link href="/admin/drives">Manage</Link>
            </div>
            <div className={styles.metricRow}>
              <Building2 aria-hidden="true" />
              <dt><span>Company records</span><small>Institution-scoped employers</small></dt>
              <dd>{companies.length}</dd>
              <Link href="/admin/companies">Manage</Link>
            </div>
            <div className={styles.metricRow}>
              <CircleAlert aria-hidden="true" />
              <dt><span>Invitations accepted</span><small>Combined 30-day total</small></dt>
              <dd>{activationCount}</dd>
              <Badge tone="success">Private</Badge>
            </div>
          </dl>
        </article>
      </ContentGrid>
    </PageContainer>
  );
}
