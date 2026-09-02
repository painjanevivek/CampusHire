"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleHelp, Menu, X } from "lucide-react";
import { NotificationCenter } from "@/features/engagement/notification-center";
import { ActivationProgress } from "@/features/engagement/activation-progress";
import { SignOutButton } from "./sign-out-button";

import styles from "./student-header.module.css";

export type WorkspaceSection =
  "Readiness" | "Opportunities" | "Applications" | "Resume" | "Roadmap" | "Profile";

const navigation: Array<{ href: string; label: WorkspaceSection }> = [
  { href: "/dashboard", label: "Readiness" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/applications", label: "Applications" },
  { href: "/resume", label: "Resume" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/profile", label: "Profile" },
];

export function StudentHeader({ active }: { active?: WorkspaceSection }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

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
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.utilities}>
          <ActivationProgress />
          <NotificationCenter />
          <Link className={`${styles.utilityControl} ${styles.helpControl}`} href="/help" aria-label="Open help center">
            <CircleHelp aria-hidden="true" />
          </Link>
          <SignOutButton destination="/sign-in" />
        </div>
      </div>
    </header>
  );
}
