"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, UserRound, X } from "lucide-react";

import styles from "./student-header.module.css";

export type WorkspaceSection =
  | "Dashboard"
  | "Opportunities"
  | "My Resume"
  | "Career Roadmap"
  | "Profile";

const navigation: Array<{ href: string; label: WorkspaceSection }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/resume", label: "My Resume" },
  { href: "/roadmap", label: "Career Roadmap" },
  { href: "/onboarding", label: "Profile" },
];

export function StudentHeader({ active }: { active?: WorkspaceSection }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="CampusHire home">
          <span aria-hidden="true">C</span>
          <strong>CampusHire</strong>
        </Link>

        <button
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? "Close student navigation" : "Open student navigation"}
          aria-expanded={menuOpen}
          aria-controls="student-navigation"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          id="student-navigation"
          className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
          aria-label="Student navigation"
        >
          {navigation.map(({ href, label }) => {
            const selected = active === label;
            return (
              <Link key={label} href={href} aria-current={selected ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.utilities}>
          <Link className={styles.profileProgress} href="/onboarding">
            <span
              role="progressbar"
              aria-label="Profile completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={70}
            >
              <i />
            </span>
            <b>70%</b>
            <span>Profile</span>
          </Link>
          <Link className={styles.account} href="/onboarding" aria-label="Open student profile">
            <UserRound size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
