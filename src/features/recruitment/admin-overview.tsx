"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CircleAlert, ClipboardCheck, FileClock, RefreshCcw } from "lucide-react";

import { Alert, Badge } from "@/components/ui/feedback";
import { apiRequest } from "@/lib/api/client";
import type { AdminApplicationPage, Company, Drive, PlacementApplication } from "./types";
import styles from "./admin-overview.module.css";

export function AdminOverview() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true); setError("");
    try {
      const [companyData, driveData, applicationData] = await Promise.all([
        apiRequest<Company[]>("/admin/recruitment/companies", { cache: "no-store" }),
        apiRequest<Drive[]>("/admin/recruitment/drives", { cache: "no-store" }),
        apiRequest<AdminApplicationPage>("/admin/recruitment/applications?page=1&page_size=50", { cache: "no-store" }),
      ]);
      setCompanies(companyData); setDrives(driveData); setApplications(applicationData.items);
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

  return (
    <main id="main-content" className={styles.page} aria-busy={loading}>
      <header><div><p>TNP control room</p><h1>{loading ? "Loading operations…" : reviewCount ? `${reviewCount} applications need review.` : "Placement operations are clear."}</h1><span>Live institutional records only. AI failures never block drives, eligibility, or applications.</span></div><button type="button" onClick={() => void load()}><RefreshCcw aria-hidden="true" />Refresh</button></header>
      {error && <Alert tone="error">{error}</Alert>}
      <section className={styles.grid} aria-label="Placement operations summary">
        <article className={styles.primary}><ClipboardCheck aria-hidden="true" /><p>Review queue</p><h2>{reviewCount}</h2><span>{manualReviewCount} with missing evidence</span><Link href="/admin/applications">Open candidate review</Link></article>
        <article><FileClock aria-hidden="true" /><p>Published drives</p><h2>{publishedDrives}</h2><span>{drives.length - publishedDrives} draft, closed, or archived</span><Link href="/admin/drives">Manage drives</Link></article>
        <article><Building2 aria-hidden="true" /><p>Company records</p><h2>{companies.length}</h2><span>Institution-scoped employers</span><Link href="/admin/companies">Manage companies</Link></article>
        <article><CircleAlert aria-hidden="true" /><p>Decision boundary</p><h2>Deterministic</h2><span>Eligibility remains available without semantic matching.</span><Badge tone="success">Core operations available</Badge></article>
      </section>
    </main>
  );
}
