"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  Clock3,
  FileSearch,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";

import { trackProductEvent } from "@/lib/product-analytics";

import { useDashboardMotion } from "./dashboard-motion";
import styles from "./student-dashboard.module.css";

export type DashboardState =
  | "ready"
  | "incomplete"
  | "processing"
  | "manual-review"
  | "ai-unavailable"
  | "error";

export type StudentDashboardData = {
  studentName: string;
  readiness: number;
  state: DashboardState;
  nextAction: {
    title: string;
    description: string;
    reason: string;
    href: string;
    estimated_minutes: number;
    unlocks: string;
    completion_criteria: string;
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
    eligibility: "Formally eligible";
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
    title: "We’re checking your evidence now.",
    detail: "You can keep browsing while the readiness view refreshes.",
  },
  "manual-review": {
    title: "A reviewer is checking your evidence.",
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
  const pageRef = useRef<HTMLElement>(null);
  useDashboardMotion(pageRef);

  return (
    <main ref={pageRef} id="main-content" className={styles.page}>
      <header className={styles.topbar} data-dashboard-reveal>
        <div>
          <p className={styles.eyebrow}>Student readiness workspace</p>
          <h1>{data.studentName}, here is the one move that matters next.</h1>
        </div>
        <Link className={styles.utilityLink} href="/opportunities">
          Browse all opportunities <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </header>

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
            <p className={styles.kicker}>Your single next readiness action</p>
            <h2 id="next-action-title">{data.nextAction.title}</h2>
            <p>{data.nextAction.description}</p>
            <Link
              className={styles.actionLink}
              href={data.nextAction.href}
              onClick={() => trackProductEvent("application_start")}
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
          </aside>
        </article>

        <article className={styles.readinessCard} data-dashboard-reveal>
          <div className={styles.readinessHeader}>
            <p className={styles.kicker}>Profile readiness</p>
            <Sparkles size={26} aria-hidden="true" />
          </div>
          <div className={styles.scoreRing}>
            <svg
            className={styles.readinessRing}
            role="progressbar"
            aria-label="Profile readiness score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={data.readiness}
            viewBox="0 0 120 120"
          >
              <circle className={styles.ringTrack} cx="60" cy="60" r="49" pathLength="100" />
              <circle
                className={styles.ringValue}
                cx="60"
                cy="60"
                r="49"
                pathLength="100"
                style={{ strokeDasharray: `${Math.min(100, Math.max(0, data.readiness))} 100` }}
              />
            </svg>
            <span><strong>{data.readiness}</strong><small>/ 100</small></span>
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
                  <span>Based on reviewed evidence</span>
                </div>
                <Link
                  className={styles.viewRole}
                  href={opportunity.href}
                  aria-label={`View ${opportunity.role} at ${opportunity.company}`}
                  onClick={() => trackProductEvent("opportunity_view")}
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
              <p>Add stronger evidence and we will re-run formal checks.</p>
            </div>
            <Link href="/roadmap">Improve my evidence</Link>
          </div>
        )}

        <p className={styles.matchDisclaimer}>
          Match is decision support, not hiring probability.
        </p>
      </section>
    </main>
  );
}
