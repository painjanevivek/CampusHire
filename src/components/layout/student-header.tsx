"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { NotificationCenter } from "@/features/engagement/notification-center";

import styles from "./student-header.module.css";

export type WorkspaceSection =
  "Readiness" | "Opportunities" | "Resume" | "Roadmap" | "Profile";

const navigation: Array<{ href: string; label: WorkspaceSection }> = [
  { href: "/dashboard", label: "Readiness" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/resume", label: "Resume" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/onboarding", label: "Profile" },
];

export function StudentHeader({ active }: { active?: WorkspaceSection }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="CampusHire home">
          <span aria-hidden="true">C</span>
          <strong>CampusHire AI</strong>
        </Link>

        <button
          className={styles.menuButton}
          type="button"
          aria-label={
            menuOpen ? "Close student navigation" : "Open student navigation"
          }
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
              <Link
                key={label}
                href={href}
                aria-current={selected ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.utilities}>
          <NotificationCenter />
          <Link
            className={styles.account}
            href="/onboarding"
            aria-label="Open student profile"
          >
            <UserRound size={18} aria-hidden="true" />
            <ChevronDown size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
