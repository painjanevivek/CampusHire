"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  BookOpen,
  ExternalLink,
  GraduationCap,
  KeyRound,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { apiRequest } from "@/lib/api/client";
import { AccountDisclosure } from "./account-disclosure";
import { CommunicationPreferences } from "./communication-preferences";
import { SessionManagement } from "./session-management";
import styles from "./profile-workspace.module.css";

type Profile = {
  full_name: string | null;
  department: string | null;
  education: Array<Record<string, unknown>>;
  skills: Array<string>;
  target_roles: Array<string>;
  github_url: string | null;
  portfolio_url: string | null;
  readiness: number;
  checklist: Array<{ key: string; label: string; complete: boolean; required: boolean }>;
};

export function ProfileWorkspace() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await apiRequest<Profile>("/profile", { cache: "no-store" }));
      setMessage("");
    } catch {
      setMessage("Your profile summary could not be refreshed. Your saved details are unchanged.");
    }
  }, []);

  useEffect(() => {
    const pending = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(pending);
  }, [loadProfile]);

  const educationCount = profile?.education.length ?? 0;
  const skillCount = profile?.skills.length ?? 0;
  const requiredItems = profile?.checklist.filter((item) => item.required) ?? [];
  const requiredCompleted = requiredItems.filter((item) => item.complete).length;

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <p>Profile and account</p>
        <h1>Your placement identity, in one place.</h1>
        <span>Keep the information used for opportunities current. Open account controls only when you need them.</span>
      </header>

      {message ? (
        <Alert tone="warning">
          {message} <button type="button" onClick={() => void loadProfile()}>Retry</button>
        </Alert>
      ) : null}

      <section className={styles.overview} aria-labelledby="profile-overview-title">
        <article className={styles.identityCard}>
          <div className={styles.identityIcon}><UserRound aria-hidden="true" /></div>
          <div className={styles.identityStatus}><ShieldCheck aria-hidden="true" /> Institution-linked profile</div>
          <h2 id="profile-overview-title">{profile?.full_name ?? "Complete your profile"}</h2>
          <p>{profile?.department ?? "Add your department and academic details to explain eligibility clearly."}</p>
          <Link className={styles.primaryAction} href="/onboarding">
            Review profile details <ExternalLink aria-hidden="true" />
          </Link>
        </article>

        <article className={styles.progressCard}>
          <div className={styles.progressHeading}>
            <div><p>Profile completion</p><span>Required and optional details are kept distinct.</span></div>
            <strong>{profile ? `${requiredCompleted} / ${requiredItems.length}` : "—"}</strong>
          </div>
          <p className={styles.progressNote} role="status">{requiredCompleted === requiredItems.length && requiredItems.length > 0 ? "All required profile details are complete." : `${requiredItems.length - requiredCompleted} required detail ${requiredItems.length - requiredCompleted === 1 ? "area" : "areas"} remaining.`}</p>
          <details>
            <summary>Review required profile evidence</summary>
            <ul>{requiredItems.map((item) => <li key={item.key}>{item.complete ? "Complete" : "Missing"}: {item.label}</li>)}</ul>
          </details>
          <dl className={styles.profileFacts}>
            <div><GraduationCap aria-hidden="true" /><dt>Education</dt><dd>{educationCount} record{educationCount === 1 ? "" : "s"}</dd></div>
            <div><BookOpen aria-hidden="true" /><dt>Target role</dt><dd>{profile?.target_roles[0] ?? "Not selected"}</dd></div>
            <div><ShieldCheck aria-hidden="true" /><dt>Reviewed skills</dt><dd>{skillCount}</dd></div>
          </dl>
          <p className={styles.progressNote}>Skills and portfolio links stay optional unless a published role explicitly requires them. This is a checklist, not an employability score.</p>
        </article>
      </section>

      <section className={styles.settings} aria-labelledby="account-settings-title">
        <header className={styles.settingsHeader}>
          <div><p>Account settings</p><h2 id="account-settings-title">Manage only what you need</h2></div>
          <span>Each section opens independently.</span>
        </header>

        <div className={styles.disclosureList}>
          <AccountDisclosure
            icon={KeyRound}
            eyebrow="Security"
            title="Active sessions"
            description="Review signed-in devices and end access you no longer recognize."
            status="On demand"
          >
            <SessionManagement destination="/sign-in" />
          </AccountDisclosure>

          <AccountDisclosure
            icon={BellRing}
            eyebrow="Communication"
            title="Email notifications"
            description="Choose optional application updates and deadline reminders."
            status="Optional"
          >
            <CommunicationPreferences />
          </AccountDisclosure>

          <AccountDisclosure
            icon={ShieldCheck}
            eyebrow="Privacy"
            title="Privacy and AI assistance"
            description="See which records are official, what AI may suggest, and how data is retained."
          >
            <div className={styles.governanceContent}>
              <p>AI suggestions never replace your verified profile, eligibility result, or an accountable placement decision.</p>
              <Link className={styles.secondaryAction} href="/privacy">Review privacy controls</Link>
            </div>
          </AccountDisclosure>

          <AccountDisclosure
            icon={Trash2}
            eyebrow="High-risk action"
            title="Account deletion"
            description="Request deletion of student data that can be removed. Confirmation is always required."
            tone="danger"
          >
            <div className={styles.governanceContent}>
              <p>Some recruitment, audit, or institutional records may need to be retained with a documented reason.</p>
              <Link className={styles.dangerAction} href="/privacy#deletion-title">Open deletion controls</Link>
            </div>
          </AccountDisclosure>
        </div>
      </section>
    </main>
  );
}
