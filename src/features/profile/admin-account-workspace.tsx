"use client";

import Link from "next/link";
import { BellRing, Building2, KeyRound, ShieldCheck, UserRoundCog } from "lucide-react";

import type { SessionUser } from "@/lib/auth/server-session";
import { AccountDisclosure } from "./account-disclosure";
import { CommunicationPreferences } from "./communication-preferences";
import { MfaStatusControl } from "./mfa-status-control";
import { SessionManagement } from "./session-management";
import styles from "./profile-workspace.module.css";

const roleLabels: Record<string, string> = {
  platform_admin: "Platform Admin",
  tnp_owner: "T&P owner",
  tnp_admin: "T&P administrator",
  tnp_reviewer: "T&P reviewer",
  tnp_auditor: "T&P auditor",
};

export function AdminAccountWorkspace({ user }: { user: SessionUser }) {
  const isPlatformAdmin = user.role === "platform_admin";
  const roleLabel = roleLabels[user.role] ?? user.role.replaceAll("_", " ");
  const membershipLabel = user.membership_status
    ? user.membership_status[0].toUpperCase() + user.membership_status.slice(1)
    : "Assigned";

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <p>Profile and account</p>
        <h1>{isPlatformAdmin ? "Your platform authority, clearly assigned." : "Your T&P access, clearly assigned."}</h1>
        <span>{isPlatformAdmin ? "Review the singleton platform assignment, then open security or communication controls when needed." : "Review the institution and role connected to this account, then open security or communication controls when needed."}</span>
      </header>

      <section className={`${styles.overview} ${styles.adminOverview}`} aria-labelledby="admin-account-title">
        <article className={styles.identityCard}>
          <div className={styles.identityIcon}><UserRoundCog aria-hidden="true" /></div>
          <div className={styles.identityStatus}><ShieldCheck aria-hidden="true" /> {isPlatformAdmin ? "Platform-assigned authority" : "Institution-assigned access"}</div>
          <h2 id="admin-account-title">{user.email}</h2>
          <p>{roleLabel}</p>
          <span className={styles.assignedNote}>{isPlatformAdmin ? "Authority transfers require an explicit, audited operational action." : "Role and institution changes require the CampusHire Platform Admin."}</span>
        </article>

        <article className={styles.accountRecord}>
          <div className={styles.recordHeading}><Building2 aria-hidden="true" /><div><p>Official account record</p><span>Read-only details from your signed-in session.</span></div></div>
          <dl>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Access</dt><dd>{roleLabel}</dd></div>
            <div><dt>Membership</dt><dd><span className={styles.activeRecord}>{isPlatformAdmin ? "Platform-wide" : membershipLabel}</span></dd></div>
            <div><dt>Institution</dt><dd className={styles.identifier}>{user.institution_id ?? "No institutional membership"}</dd></div>
          </dl>
        </article>
      </section>

      <section className={styles.settings} aria-labelledby="admin-settings-title">
        <header className={styles.settingsHeader}>
          <div><p>Account settings</p><h2 id="admin-settings-title">Security, communication, and governance</h2></div>
          <span>Operational controls stay out of the way until opened.</span>
        </header>

        <div className={styles.disclosureList}>
          <AccountDisclosure
            icon={KeyRound}
            eyebrow="Security"
            title="Active sessions"
            description="Review active sessions and end access on devices you no longer use."
            status="On demand"
          >
            <SessionManagement destination={isPlatformAdmin ? "/admin/sign-in" : "/tnp/sign-in"} />
          </AccountDisclosure>

          <AccountDisclosure
            icon={ShieldCheck}
            eyebrow="Security"
            title="Authenticator sign-in"
            description={`MFA is optional until you enable it. Once enrolled, it is required on every future ${isPlatformAdmin ? "Platform Admin" : "T&P"} sign-in.`}
            status="Account setting"
          >
            <MfaStatusControl />
          </AccountDisclosure>

          <AccountDisclosure
            icon={BellRing}
            eyebrow="Communication"
            title="Email notifications"
            description="Choose optional operational updates while keeping security delivery enabled."
            status="Optional"
          >
            <CommunicationPreferences />
          </AccountDisclosure>

          <AccountDisclosure
            icon={ShieldCheck}
            eyebrow="Governance"
            title="Data use and account responsibility"
            description="Review the boundaries for student data, AI assistance, and institutional access."
          >
            <div className={styles.governanceContent}>
              <p>Use student records only for approved placement work. AI explanations never replace published rules or accountable human decisions.</p>
              <div className={styles.inlineLinks}>
                <Link className={styles.secondaryAction} href="/data-rights">Review data rights</Link>
                <Link className={styles.textAction} href="/help">Contact support</Link>
              </div>
            </div>
          </AccountDisclosure>
        </div>
      </section>
    </main>
  );
}
