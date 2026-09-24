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
} from "lucide-react";

import { Alert } from "@/components/ui/feedback";
import { cachedApiRequest } from "@/lib/api/client";
import { AccountDisclosure } from "./account-disclosure";
import { CommunicationPreferences } from "./communication-preferences";
import { PrivacyRequestTracker } from "@/features/privacy/privacy-request-tracker";
import { SessionManagement } from "./session-management";
import { ActivationProgress } from "@/features/engagement/activation-progress";
import { ProfilePhotoUpload } from "./profile-photo";
import { SavedRoles } from "./saved-roles";
import { MfaStatusControl } from "./mfa-status-control";
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
  const [activeTab, setActiveTab] = useState<"profile" | "saved">("profile");

  const loadProfile = useCallback(async (force = false) => {
    try {
      setProfile(await cachedApiRequest<Profile>("/profile", { force }));
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
        <h1>Your profile.</h1>
        <span>Manage your placement details, activation, and account settings.</span>
      </header>

      {message ? (
        <Alert tone="warning">
          {message} <button type="button" onClick={() => void loadProfile(true)}>Retry</button>
        </Alert>
      ) : null}

      <div className={styles.profileTabs} role="tablist" aria-label="Profile sections">
        <button type="button" role="tab" aria-selected={activeTab === "profile"} onClick={() => setActiveTab("profile")}>Profile</button>
        <button type="button" role="tab" aria-selected={activeTab === "saved"} onClick={() => setActiveTab("saved")}>Saved roles</button>
      </div>

      {activeTab === "profile" ? <><section className={styles.overview} aria-labelledby="profile-overview-title">
        <article className={styles.identityCard}>
          <ProfilePhotoUpload />
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
          <p className={styles.progressNote} role="status">{!profile ? "Profile completion is not available yet." : requiredCompleted === requiredItems.length && requiredItems.length > 0 ? "All required profile details are complete." : `${requiredItems.length - requiredCompleted} required detail ${requiredItems.length - requiredCompleted === 1 ? "area" : "areas"} remaining.`}</p>
          <details>
            <summary>Check required profile details</summary>
            <ul>{requiredItems.map((item) => <li key={item.key}>{item.complete ? "Complete" : "Missing"}: {item.label}</li>)}</ul>
          </details>
          <dl className={styles.profileFacts}>
            <div><GraduationCap aria-hidden="true" /><dt>Education</dt><dd>{educationCount} record{educationCount === 1 ? "" : "s"}</dd></div>
            <div><BookOpen aria-hidden="true" /><dt>Target role</dt><dd>{profile?.target_roles[0] ?? "Not selected"}</dd></div>
            <div><ShieldCheck aria-hidden="true" /><dt>Reviewed skills</dt><dd>{skillCount}</dd></div>
          </dl>
          <p className={styles.progressNote}>Skills and portfolio links stay optional unless a published role explicitly requires them. This is a checklist, not an employability score.</p>
          <ActivationProgress inline />
        </article>
      </section>

      <section id="account-settings" className={styles.settings} aria-labelledby="account-settings-title" tabIndex={-1}>
        <header className={styles.settingsHeader}>
          <div><p>Account settings</p><h2 id="account-settings-title">Manage only what you need</h2></div>
          <span>Each section opens independently.</span>
        </header>

        <div className={styles.disclosureList}>
          <AccountDisclosure
            icon={ShieldCheck}
            eyebrow="Security"
            title="Authenticator sign-in"
            description="Add a rotating code from Google Authenticator or another compatible authenticator app."
            status="Optional"
          >
            <MfaStatusControl workspace="student" />
          </AccountDisclosure>

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
              <PrivacyRequestTracker />
            </div>
          </AccountDisclosure>

        </div>
      </section></> : <SavedRoles />}
    </main>
  );
}
