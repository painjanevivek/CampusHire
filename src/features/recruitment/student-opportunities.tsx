"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Alert, Badge, EmptyState } from "@/components/ui/feedback";
import { SavedViews } from "@/features/experience/saved-views";
import experience from "@/features/experience/experience.module.css";
import { cachedApiRequest, csrfRequest } from "@/lib/api/client";
import type { Opportunity, OpportunityPage } from "./types";
import styles from "./student-opportunities.module.css";

function eligibilityCopy(opportunity: Opportunity) {
  if (opportunity.eligibility.status === "eligible") return "Eligible";
  if (opportunity.eligibility.status === "needs_manual_review") return "Needs review";
  if (opportunity.eligibility.status === "ineligible") return "Not eligible";
  return "Rules unavailable";
}

function tone(opportunity: Opportunity): "success" | "warning" | "neutral" {
  if (opportunity.eligibility.status === "eligible") return "success";
  if (opportunity.eligibility.status === "needs_manual_review") return "warning";
  return "neutral";
}

export function StudentOpportunities() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<OpportunityPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [comparison, setComparison] = useState<Array<{ id: string; title: string }>>([]);

  const queryString = searchParams.toString();
  const load = useCallback(async (force = false) => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setData(await cachedApiRequest<OpportunityPage>(`/opportunities${queryString ? `?${queryString}` : ""}`, { force }));
      requestAnimationFrame(() => {
        const savedScroll = window.history.state?.campushireOpportunityScroll;
        if (typeof savedScroll === "number") window.scrollTo({ top: savedScroll, behavior: "instant" });
      });
    } catch {
      setError("Opportunities could not be loaded. Your filters are preserved; retry when the connection returns.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  function updateFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "location", "work_mode", "skill", "eligibility", "application_state", "deadline_within_days", "saved_only", "sort"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    router.replace(`/opportunities${params.size ? `?${params}` : ""}`);
  }

  async function toggleSave(opportunity: Opportunity) {
    setSaving(opportunity.id);
    setError("");
    try {
      const result = await csrfRequest<{ saved: boolean }>(`/opportunities/${opportunity.id}/save`, { method: "POST" });
      setData((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === opportunity.id ? { ...item, saved: result.saved } : item),
      } : current);
    } catch {
      setError("The saved-role state could not be changed. Try again without leaving this page.");
    } finally {
      setSaving(null);
    }
  }

  const items = data?.items ?? [];
  const selected = items[0];

  return (
    <main id="main-content" className={styles.page} data-navigation-ready={!loading && !!data && !error} onClickCapture={event => {
      const link = (event.target as HTMLElement).closest("a");
      if (link?.getAttribute("href")?.startsWith("/opportunities/")) window.history.replaceState({ ...window.history.state, campushireOpportunityScroll: window.scrollY }, "");
    }}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Published for your institution</p>
          <h1>Find your next opportunity</h1>
          <p>Published rules decide eligibility. Your skills match is shown separately when it is ready.</p>
        </div>
        <Link href="/opportunities?saved_only=true"><Bookmark aria-hidden="true" /> Saved roles</Link>
      </header>

      <form
        key={queryString}
        className={styles.searchPanel}
        onSubmit={updateFilters}
        aria-label="Search opportunities"
      >
        <label className={styles.searchField}>
          <Search aria-hidden="true" />
          <span className="srOnly">Role, company, or keyword</span>
          <input name="q" defaultValue={searchParams.get("q") ?? ""} placeholder="Role, company, or keyword" />
        </label>
        <label className={styles.searchField}>
          <MapPin aria-hidden="true" />
          <span className="srOnly">Location</span>
          <input name="location" defaultValue={searchParams.get("location") ?? ""} placeholder="Location" />
        </label>
        <button className={styles.searchButton} type="submit">Search roles</button>
        <div className={styles.filters}>
          <label>Sort<select name="sort" defaultValue={searchParams.get("sort") ?? "deadline"}><option value="deadline">Deadline first</option><option value="newest">Newest first</option><option value="company">Company name</option></select></label>
          <label>Work mode<select name="work_mode" defaultValue={searchParams.get("work_mode") ?? ""}><option value="">All modes</option><option value="on-site">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option></select></label>
          <label>Skill<input name="skill" defaultValue={searchParams.get("skill") ?? ""} placeholder="e.g. Python" /></label>
          <label>Eligibility<select name="eligibility" defaultValue={searchParams.get("eligibility") ?? ""}><option value="">All eligibility states</option><option value="eligible">Eligible</option><option value="ineligible">Not eligible</option><option value="needs_manual_review">Needs review</option><option value="unavailable">Rules unavailable</option></select></label>
          <label>Application<select name="application_state" defaultValue={searchParams.get("application_state") ?? ""}><option value="">Any application state</option><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="offered">Offered</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option></select></label>
          <label>Deadline<select name="deadline_within_days" defaultValue={searchParams.get("deadline_within_days") ?? ""}><option value="">Any open deadline</option><option value="7">Next 7 days</option><option value="30">Next 30 days</option><option value="90">Next 90 days</option></select></label>
          <label className={styles.checkbox}><input name="saved_only" type="checkbox" value="true" defaultChecked={searchParams.get("saved_only") === "true"} /> Saved only</label>
          <Link className={styles.clear} href="/opportunities"><RotateCcw aria-hidden="true" /> Clear</Link>
        </div>
      </form>
      <SavedViews query={queryString} />

      {error && <Alert tone="error">{error} <button type="button" onClick={() => void load(true)}>Retry</button></Alert>}

      <div className={styles.content} aria-busy={loading}>
        <section className={styles.results} aria-labelledby="opportunity-results">
          <div className={styles.sectionHeader}><h2 id="opportunity-results">{loading ? "Loading roles…" : `${data?.total ?? 0} opportunities`}</h2><span>Deadline first</span></div>
          {loading ? <div className={styles.loading} role="status"><span /><span /><span /></div> : null}
          {!loading && !error && !items.length ? <EmptyState title={data?.empty_reason === "profile_incomplete" ? "Complete your required profile" : data?.empty_reason === "filters_exclude_results" ? "No roles match these filters" : "No open placement drive yet"}><span>{data?.empty_reason === "profile_incomplete" ? "Add required education and target-role facts so eligibility can be explained." : data?.empty_reason === "filters_exclude_results" ? "Clear or broaden filters; your saved roles and applications are unchanged." : "Your placement cell has not published an open role, or the current drive has closed."}</span></EmptyState> : null}
          <div className={styles.list}>
            {items.map((opportunity) => (
              <article key={opportunity.id} className={styles.card}>
                <div className={styles.mark} aria-hidden="true">{opportunity.company_name.slice(0, 1)}</div>
                <div className={styles.cardBody}>
                  <p>{opportunity.company_name}</p>
                  <h3><Link href={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></h3>
                  <div className={styles.meta}><span><MapPin aria-hidden="true" />{opportunity.location} · {opportunity.work_mode}</span><span><CalendarDays aria-hidden="true" />Apply by {new Date(opportunity.deadline_at).toLocaleDateString()}</span></div>
                  <div className={styles.skills}>{opportunity.skills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div>
                </div>
                <div className={styles.cardActions}>
                  <label className={experience.button}><input type="checkbox" checked={comparison.some(item => item.id === opportunity.id)} disabled={comparison.length >= 3 && !comparison.some(item => item.id === opportunity.id)} onChange={event => setComparison(current => event.target.checked ? [...current, { id: opportunity.id, title: opportunity.title }] : current.filter(item => item.id !== opportunity.id))} /> Compare {opportunity.title}</label>
                  <div className={styles.states}><Badge tone={tone(opportunity)}>{eligibilityCopy(opportunity)}</Badge>{opportunity.application_status ? <Badge tone={opportunity.application_status === "withdrawn" ? "neutral" : "success"}>Application · {opportunity.application_status.replaceAll("_", " ")}</Badge> : null}</div>
                  <button type="button" disabled={saving === opportunity.id} onClick={() => void toggleSave(opportunity)} aria-label={opportunity.saved ? `Remove ${opportunity.title} from saved roles` : `Save ${opportunity.title}`}>
                    {opportunity.saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
                  </button>
                  <Link href={`/opportunities/${opportunity.id}`} aria-label={`View ${opportunity.title}`}><ChevronRight aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.explainer} aria-label="Opportunity decision guide">
          <div className={styles.guideIcon}><ShieldCheck aria-hidden="true" /></div>
          <h2>{selected ? `Why ${selected.title} is shown` : "How decisions work"}</h2>
          <p>{selected?.eligibility.status === "eligible" ? "Your current profile meets every published rule." : selected?.eligibility.status === "needs_manual_review" ? "You can still view this role while a person reviews the missing information. You are not rejected automatically." : "Only active roles published by your institution appear here."}</p>
          <dl>
            <div><dt>Eligibility</dt><dd>Rules and verified profile facts</dd></div>
            <div><dt>Semantic match</dt><dd>Separate · not calculated in this phase</dd></div>
            <div><dt>Application</dt><dd>Locks resume and decision versions</dd></div>
          </dl>
          <Link href={selected ? `/opportunities/${selected.id}` : "/resume"}><BriefcaseBusiness aria-hidden="true" />{selected ? "Review role details" : "Prepare your resume"}</Link>
        </aside>
      </div>
      {!!comparison.length && <aside className={experience.tray} aria-label="Comparison tray"><span>{comparison.length} of 3 roles selected</span>{comparison.map(item => <button className={experience.button} key={item.id} onClick={() => setComparison(current => current.filter(role => role.id !== item.id))}>Remove {item.title}</button>)}{comparison.length >= 2 ? <Link className={experience.primary} href={`/opportunities/compare?roles=${comparison.map(item => item.id).join(",")}`}>Compare selected roles</Link> : <span>Select one more role</span>}</aside>}
    </main>
  );
}
