"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building2, ExternalLink, Plus, RefreshCcw } from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import type { Company } from "./types";
import styles from "./admin-recruitment.module.css";

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setCompanies(await apiRequest<Company[]>("/admin/recruitment/companies", { cache: "no-store" })); }
    catch { setError("Company records could not be loaded. No changes were made."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const company = await csrfRequest<Company>("/admin/recruitment/companies", {
        method: "POST",
        body: JSON.stringify({ name: data.get("name"), website_url: data.get("website_url") || null, description: data.get("description") || null }),
      });
      setCompanies((current) => [...current, company].sort((a, b) => a.name.localeCompare(b.name)));
      setShowForm(false);
      event.currentTarget.reset();
    } catch { setError("The company was not created. Check for a duplicate name and valid HTTPS website."); }
    finally { setSubmitting(false); }
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Employer records</p><h1>Companies</h1><p>Verify the organization once, then attach it to accountable placement drives.</p></div><button className={styles.primary} type="button" onClick={() => setShowForm((value) => !value)}><Plus aria-hidden="true" />{showForm ? "Close form" : "Add company"}</button></header>
      {error && <Alert tone="error">{error} <button type="button" onClick={() => void load()}>Retry</button></Alert>}
      {showForm ? <form className={styles.createPanel} onSubmit={create}><div><p className={styles.step}>New employer record</p><h2>Company details</h2></div><Input id="company-name" name="name" label="Company name" required minLength={2} maxLength={200} /><Input id="company-website" name="website_url" label="Website (optional)" type="url" placeholder="https://example.com" /><label className={styles.textarea}><span>Description (optional)</span><textarea name="description" maxLength={4000} rows={3} /></label><div className={styles.formActions}><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button className={styles.primary} type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create company"}</button></div></form> : null}

      <section className={styles.collection} aria-labelledby="company-list-title" aria-busy={loading}>
        <div className={styles.collectionHeader}><h2 id="company-list-title">Institution companies</h2><button type="button" onClick={() => void load()} aria-label="Refresh companies"><RefreshCcw aria-hidden="true" /></button></div>
        {loading ? <p className={styles.loading}>Loading company records…</p> : null}
        {!loading && !companies.length ? <EmptyState title="No companies yet"><span>Create a verified employer record before opening a drive.</span></EmptyState> : null}
        <div className={styles.companyGrid}>{companies.map((company) => <article key={company.id} className={styles.companyCard}><div className={styles.companyMark}><Building2 aria-hidden="true" /></div><div><h3>{company.name}</h3><p>{company.description || "No description added."}</p><Badge>{company.status}</Badge></div>{company.website_url ? <a href={company.website_url} target="_blank" rel="noreferrer" aria-label={`Open ${company.name} website`}><ExternalLink aria-hidden="true" /></a> : null}</article>)}</div>
      </section>
    </main>
  );
}
