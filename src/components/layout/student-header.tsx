"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Menu, UserRound, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { NotificationCenter } from "@/features/engagement/notification-center";
import { ActivationProgress } from "@/features/engagement/activation-progress";
import { SignOutButton } from "./sign-out-button";

import styles from "./student-header.module.css";

type WorkspaceSection =
  "Home" | "Opportunities" | "Applications" | "Preparation";

const navigation: Array<{ href: string; label: WorkspaceSection }> = [
  { href: "/dashboard", label: "Home" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/applications", label: "Applications" },
  { href: "/preparation", label: "Preparation" },
];

export function StudentHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="CampusHire home">
          <BrandMark />
          <strong>CampusHire AI</strong>
        </Link>

        <button
          ref={menuButton}
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
          ref={menu}
          id="student-navigation"
          className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
          aria-label="Student navigation"
        >
          {navigation.map(({ href, label }) => {
            const selected = pathname === href || pathname.startsWith(`${href}/`) || (href === "/preparation" && ["/resume", "/roadmap"].some(path => pathname.startsWith(path)));
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
          <Link className={styles.mobileHelp} href="/help" onClick={() => setMenuOpen(false)}>Help center</Link>
        </nav>

        <div className={styles.utilities}>
          <Link className={styles.utilityControl} href="/profile" aria-label="Open student profile" aria-current={pathname.startsWith("/profile") ? "page" : undefined}><UserRound aria-hidden="true" /></Link>
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
