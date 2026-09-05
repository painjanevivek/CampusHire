"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  Clock3,
  FileSearch,
  MapPin,
  ListChecks,
  Target,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/layout/page-layout";
import styles from "./student-dashboard.module.css";

export type DashboardState =
  | "ready"
  | "incomplete"
  | "processing"
  | "manual-review"
  | "ai-unavailable"
  | "error";

export type StudentDashboardData = {
  upcoming?: Array<{ key: string; title: string; reason: string; href: string; deadline_at?: string | null }>;
  timezone?: string;
  studentName: string;
  readiness: {
    policy_version: string;
    completed_evidence: number;
    total_evidence: number;
    required_complete: boolean;
  };
  state: DashboardState;
  nextAction: {
    deadline_at?: string | null;
    title: string;
    description: string;
    reason: string;
    href: string;
    estimated_minutes: number;
    unlocks: string;
    completion_criteria: string;
    policy_version: string;
    source_facts: string[];
  };
  evidence: Array<{
    label: string;
    value: string;
    status: "verified" | "pending" | "review";
  }>;
  opportunities: Array<{
    company: string;
    role: string;
    location: string;
    eligibility: "Eligible";
    match: number | null;
    href: string;
  }>;
};

const stateMessages: Record<
  Exclude<DashboardState, "ready">,
  { title: string; detail: string }
> = {
  incomplete: {
    title: "Finish your profile to unlock eligibility checks.",
    detail: "Education and target-role details are still required.",
  },
  processing: {
    title: "We’re checking your profile details now.",
    detail: "You can keep browsing while the readiness view refreshes.",
  },
  "manual-review": {
    title: "A reviewer is checking your information.",
    detail: "We will preserve your current eligibility until the review is complete.",
  },
  "ai-unavailable": {
    title: "Check unavailable. Match explanations are temporarily unavailable.",
    detail: "Formal eligibility remains visible and is not affected.",
  },
  error: {
    title: "We couldn’t load your readiness.",
    detail: "Your saved profile is safe. Refresh the page to try again.",
  },
};

export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  return (
    <PageContainer context="student" className={styles.page} data-navigation-ready="true">
      <PageHeader
        className={styles.topbar}
        data-dashboard-reveal
        eyebrow="Student readiness workspace"
        title={`${data.studentName}, here is the one move that matters next.`}
        actions={(
          <Link className={styles.utilityLink} href="/opportunities">
            Browse all opportunities <ArrowRight size={17} aria-hidden="true" />
          </Link>
        )}
      />

      {data.state !== "ready" ? (
        <section className={styles.stateNotice} role="status" data-dashboard-reveal>
          <CircleAlert size={21} aria-hidden="true" />
          <div>
            <strong>{stateMessages[data.state].title}</strong>
            <p>{stateMessages[data.state].detail}</p>
          </div>
        </section>
      ) : null}

      <section className={styles.actionGrid} aria-label="Next readiness action">
        <article className={styles.primaryAction} data-dashboard-reveal>
          <div className={styles.actionNumber} aria-hidden="true">
            01
          </div>
          <div className={styles.actionCopy}>
            <p className={styles.kicker}>Your next placement action</p>
            <h2 id="next-action-title">{data.nextAction.title}</h2>
            <p>{data.nextAction.description}</p>
            {data.nextAction.deadline_at && <p>Due {new Date(data.nextAction.deadline_at).toLocaleString(undefined, { timeZone: data.timezone ?? "UTC" })} ({data.timezone ?? "UTC"})</p>}
            <Link
              className={styles.actionLink}
              href={data.nextAction.href}
            >
              Complete this action <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <aside className={styles.reason} aria-label="Reason for this recommendation">
            <Target size={21} aria-hidden="true" />
            <strong>Why this next?</strong>
            <p>{data.nextAction.reason}</p>
            <dl>
              <div><dt>Expected effort</dt><dd>{data.nextAction.estimated_minutes} minutes</dd></div>
              <div><dt>Complete when</dt><dd>{data.nextAction.completion_criteria}</dd></div>
              <div><dt>Expected effect</dt><dd>Unlocks {data.nextAction.unlocks.toLowerCase()}</dd></div>
            </dl>
            <details className={styles.actionEvidence}>
              <summary>Evidence behind this action</summary>
              <p>Policy {data.nextAction.policy_version}</p>
              <ul>{data.nextAction.source_facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
            </details>
          </aside>
        </article>

        <article className={styles.readinessCard} data-dashboard-reveal>
          <div className={styles.readinessHeader}>
            <p className={styles.kicker}>Reviewed evidence</p>
            <ListChecks size={26} aria-hidden="true" />
          </div>
          <div className={styles.evidenceSummary}>
            <strong>{data.readiness.completed_evidence} of {data.readiness.total_evidence}</strong>
            <span>evidence areas complete</span>
            <small>{data.readiness.required_complete ? "Required identity and resume evidence are ready." : "Required evidence is still incomplete."}</small>
          </div>
          <dl className={styles.evidenceList}>
            {data.evidence.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd data-status={item.status}>
                  {item.status === "verified" ? (
                    <BadgeCheck size={15} aria-hidden="true" />
                  ) : item.status === "review" ? (
                    <Clock3 size={15} aria-hidden="true" />
                  ) : null}
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className={styles.policyVersion}>Readiness policy {data.readiness.policy_version}</p>
          {!!data.upcoming?.length && <section aria-label="Upcoming actions"><h2>Also on your horizon</h2><ul>{data.upcoming.slice(0, 5).map(item => <li key={item.key}>
            <Link href={item.href}>{item.title}</Link><p>{item.reason}</p>
            {item.deadline_at && <small>{new Date(item.deadline_at).toLocaleString(undefined, { timeZone: data.timezone ?? "UTC" })} ({data.timezone ?? "UTC"})</small>}
          </li>)}</ul></section>}
        </article>
      </section>

      <section className={styles.opportunities} aria-labelledby="opportunities-title">
        <header className={styles.sectionHeader} data-dashboard-reveal>
          <div>
            <p className={styles.eyebrow}>Eligible now</p>
            <h2 id="opportunities-title">Opportunities backed by your profile.</h2>
          </div>
          <Link href="/opportunities">See every eligible role</Link>
        </header>

        {data.opportunities.length > 0 ? (
          <div className={styles.opportunityList}>
            {data.opportunities.map((opportunity, index) => (
              <article
                key={`${opportunity.company}-${opportunity.role}`}
                className={styles.opportunityCard}
                aria-label={`${opportunity.role} at ${opportunity.company}`}
                data-dashboard-reveal
              >
                <span className={styles.opportunityNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className={styles.opportunityIdentity}>
                  <span className={styles.companyMark} aria-hidden="true">
                    <BriefcaseBusiness size={20} />
                  </span>
                  <div>
                    <p>{opportunity.company}</p>
                    <h3>{opportunity.role}</h3>
                    <span>
                      <MapPin size={14} aria-hidden="true" /> {opportunity.location}
                    </span>
                  </div>
                </div>
                <div className={styles.eligibility}>
                  <BadgeCheck size={17} aria-hidden="true" />
                  <span>{opportunity.eligibility}</span>
                </div>
                <div className={styles.match}>
                  <strong>
                    {opportunity.match === null
                      ? "Explanation pending"
                      : `${opportunity.match}% match`}
                  </strong>
                  <span>Based on your reviewed details</span>
                </div>
                <Link
                  className={styles.viewRole}
                  href={opportunity.href}
                  aria-label={`View ${opportunity.role} at ${opportunity.company}`}
                >
                  <ArrowRight size={19} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState} data-dashboard-reveal>
            <FileSearch size={30} aria-hidden="true" />
            <div>
              <h3>No eligible opportunities yet.</h3>
              <p>Add more profile details and we will check again.</p>
            </div>
            <Link href="/roadmap">Improve my profile</Link>
          </div>
        )}

        <p className={styles.matchDisclaimer}>
          Match is decision support, not hiring probability.
        </p>
      </section>
    </PageContainer>
  );
}
