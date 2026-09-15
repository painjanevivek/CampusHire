"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  MapPin,
  Scale,
  ShieldQuestion,
} from "lucide-react";

import { Alert, Badge } from "@/components/ui/feedback";
import { apiRequest, csrfRequest } from "@/lib/api/client";
import type {
  Opportunity,
  SemanticMatch,
} from "./types";
import styles from "./student-opportunity-detail.module.css";

function eligibilityHeading(status: Opportunity["eligibility"]["status"]): string {
  if (status === "eligible") return "Why you are eligible";
  if (status === "ineligible") return "Why this role is not currently available";
  if (status === "needs_manual_review") return "What needs manual review";
  return "Why eligibility is unavailable";
}

export function StudentOpportunityDetail({ roleId }: { roleId: string }) {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [match, setMatch] = useState<SemanticMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    const relevance = csrfRequest<SemanticMatch>(`/opportunities/${roleId}/match`, {
      method: "POST",
    }).catch(() => null);
    try {
      const role = await apiRequest<Opportunity>(`/opportunities/${roleId}`, {
        cache: "no-store",
      });
      setOpportunity(role);
      setLoading(false);
      setMatch(await relevance);
    } catch {
      setError(
        "This role could not be loaded. It may be closed, unpublished, or temporarily unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);

  async function toggleSave() {
    if (!opportunity) return;
    setError("");
    try {
      const result = await csrfRequest<{ saved: boolean }>(
        `/opportunities/${opportunity.id}/save`,
        { method: "POST" },
      );
      setOpportunity({ ...opportunity, saved: result.saved });
    } catch {
      setError("The saved-role state could not be changed. Try again.");
    }
  }

  if (loading)
    return (
      <main id="main-content" className={styles.state} aria-busy="true">
        <p>Loading role details…</p>
      </main>
    );
  if (!opportunity)
    return (
      <main id="main-content" className={styles.state}>
        <Alert tone="error">{error}</Alert>
        <button type="button" onClick={() => void load()}>
          Retry
        </button>
        <Link href="/opportunities">Back to opportunities</Link>
      </main>
    );

  const canApply =
    ["eligible", "needs_manual_review"].includes(
      opportunity.eligibility.status,
    ) && !opportunity.application_status;
  const statusTone =
    opportunity.eligibility.status === "eligible"
      ? "success"
      : opportunity.eligibility.status === "needs_manual_review"
        ? "warning"
        : "neutral";

  return (
    <main id="main-content" className={styles.page}>
      <Link className={styles.back} href="/opportunities">
        <ArrowLeft aria-hidden="true" /> Back to opportunities
      </Link>
      {error && <Alert tone="error">{error}</Alert>}

      <div className={styles.layout}>
        <article className={styles.role}>
          <header className={styles.hero}>
            <div className={styles.mark} aria-hidden="true">
              {opportunity.company_name.slice(0, 1)}
            </div>
            <div>
              <p>
                {opportunity.company_name} · {opportunity.drive_title}
              </p>
              <h1>{opportunity.title}</h1>
              <div className={styles.meta}>
                <span>
                  <MapPin aria-hidden="true" />
                  {opportunity.location} · {opportunity.work_mode}
                </span>
                <span>
                  <CalendarDays aria-hidden="true" />
                  Apply by {new Date(opportunity.deadline_at).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.save}
              onClick={() => void toggleSave()}
              aria-label={
                opportunity.saved ? "Remove from saved roles" : "Save role"
              }
            >
              {opportunity.saved ? (
                <BookmarkCheck aria-hidden="true" />
              ) : (
                <Bookmark aria-hidden="true" />
              )}
            </button>
          </header>

          <section><h2>Prepare for this opportunity</h2><p>Compare the published requirements with your reviewed evidence, without changing eligibility.</p><Link href={`/preparation?role=${roleId}`}>Review preparation guidance</Link></section>

          <section>
            <h2>Role overview</h2>
            <p>{opportunity.description}</p>
            <dl className={styles.facts}>
              <div>
                <dt>Employment</dt>
                <dd>{opportunity.employment_type}</dd>
              </div>
              <div>
                <dt>Work mode</dt>
                <dd>{opportunity.work_mode}</dd>
              </div>
              <div>
                <dt>Compensation</dt>
                <dd>
                  {opportunity.salary_display ?? "Shared by the placement cell"}
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <h2>Skills</h2>
            <div className={styles.tags}>
              {opportunity.skills.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>
          <section>
            <h2>Published requirements</h2>
            <ul>
              {opportunity.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.rules}>
            <div className={styles.sectionTitle}>
              <div>
                <p>Based on published rules</p>
                <h2>{eligibilityHeading(opportunity.eligibility.status)}</h2>
              </div>
              <Badge tone={statusTone}>
                {opportunity.eligibility.status.replaceAll("_", " ")}
              </Badge>
            </div>
            {opportunity.eligibility.results.length ? (
              <ul>
                {opportunity.eligibility.results.map((result) => (
                  <li key={result.label}>
                    <span
                      className={
                        result.passed === true
                          ? styles.pass
                          : result.passed === false
                            ? styles.fail
                            : styles.review
                      }
                    >
                      {result.passed === true ? (
                        <CheckCircle2 aria-hidden="true" />
                      ) : (
                        <CircleAlert aria-hidden="true" />
                      )}
                    </span>
                    <div>
                      <strong>{result.label}</strong>
                      <p>{result.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Alert tone="warning">
                No published rule set is available. Applications stay
                unavailable until the placement cell publishes reviewed rules.
              </Alert>
            )}
            {opportunity.eligibility.rule_version && (
              <p className={styles.version}>
                Rule version {opportunity.eligibility.rule_version} · evaluated
                from your current profile
              </p>
            )}
            {opportunity.eligibility.missing_evidence.length ? (
              <Alert tone="warning">
                Manual review needs: {opportunity.eligibility.missing_evidence.join(", ")}.
                Missing information does not cause an automatic rejection.
              </Alert>
            ) : null}
          </section>
        </article>

        <aside className={styles.actionPanel}>
          <div className={styles.decisionHeader}>
            <ShieldQuestion aria-hidden="true" />
            <div>
              <p>Eligibility</p>
              <strong>
                {opportunity.eligibility.status.replaceAll("_", " ")}
              </strong>
            </div>
          </div>
          <div className={styles.separate}>
            <Scale aria-hidden="true" />
            <div>
              <strong>Skills match</strong>
              {match?.status === "available" ? (
                <>
                  <p>
                    <b>{match.score}% match</b> · {match.scoring_version}
                  </p>
                  <ul>
                    {match.explanation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>
                  {match?.explanation[0] ??
                    "Skills matching is unavailable. Your eligibility has not changed."}
                </p>
              )}
            </div>
          </div>
          {opportunity.application_status ? (
            <Alert tone="success">
              <strong>
                Application{" "}
                {opportunity.application_status.replaceAll("_", " ")}.
              </strong>
              <br />
              The submitted snapshot cannot be changed by later profile edits.
            </Alert>
          ) : null}
          <nav className={styles.aiActions} aria-label="Opportunity preparation actions">
            <Link href={`/preparation?role=${roleId}`}>Explain requirements</Link>
            <Link href={`/copilot?role=${roleId}`}>Prepare for this role</Link>
            <Link href={`/resume/studio?role=${roleId}`}>Tailor my resume</Link>
          </nav>
          {canApply ? (
            <Link className={styles.primary} href={`/opportunities/${roleId}/apply`}>
              Build application packet
            </Link>
          ) : null}
          {!canApply && !opportunity.application_status ? (
            <button className={styles.primary} type="button" disabled>
              Application unavailable
            </button>
          ) : null}
          <p className={styles.policy}>
            Missing information is sent for manual review. It does not cause an
            automatic rejection.
          </p>
        </aside>
      </div>
    </main>
  );
}
