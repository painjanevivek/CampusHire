import type { ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Check,
  FileText,
  LayoutDashboard,
  Route,
  UserRound,
} from "lucide-react";

import styles from "./student-workspace.module.css";

export type WorkspaceSection =
  | "Dashboard"
  | "Opportunities"
  | "My Resume"
  | "Career Roadmap"
  | "Profile";

const navigation: Array<{
  href: string;
  label: WorkspaceSection;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/opportunities",
    label: "Opportunities",
    icon: BriefcaseBusiness,
  },
  { href: "/resume", label: "My Resume", icon: FileText },
  { href: "/roadmap", label: "Career Roadmap", icon: Route },
  { href: "/onboarding", label: "Profile", icon: UserRound },
];

function StudentSidebar({ active }: { active: WorkspaceSection }) {
  return (
    <aside className={styles.sidebar} aria-label="Student workspace">
      <Link className={styles.brand} href="/dashboard" aria-label="CampusHire dashboard">
        <span className={styles.brandMark} aria-hidden="true">
          CH
        </span>
        <span>CampusHire</span>
      </Link>

      <nav className={styles.navigation} aria-label="Workspace">
        {navigation.map(({ href, label, icon: Icon }) => {
          const isActive = label === active;

          return (
            <Link
              key={label}
              href={href}
              className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <section className={styles.profilePrompt} aria-labelledby="profile-progress-title">
        <div className={styles.profilePromptHeader}>
          <span className={styles.profileIcon} aria-hidden="true">
            <FileText size={20} />
            <Check size={12} />
          </span>
          <strong id="profile-progress-title">Your evidence profile</strong>
        </div>
        <p>Add the remaining proof to improve opportunity explanations.</p>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="Profile completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={70}
        >
          <span />
        </div>
        <div className={styles.progressFooter}>
          <strong>70%</strong>
          <Link href="/onboarding">Continue profile</Link>
        </div>
      </section>
    </aside>
  );
}

export function StudentWorkspace({
  active,
  children,
  aside,
}: {
  active: WorkspaceSection;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className={`${styles.workspace} ${aside ? styles.withAside : ""}`}>
      <StudentSidebar active={active} />
      <div className={styles.body}>{children}</div>
      {aside ? <div className={styles.contextPanel}>{aside}</div> : null}
    </div>
  );
}
