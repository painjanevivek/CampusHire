"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Menu, UserRound, X } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import styles from "./admin-workspace.module.css";
import { SignOutButton } from "./sign-out-button";

const navigation = [
  { group: "Overview", items: [{ href: "/admin/dashboard", label: "Overview" }] },
  { group: "Recruitment", items: [{ href: "/admin/applications", label: "Applications" }, { href: "/admin/drives", label: "Drives" }, { href: "/admin/companies", label: "Companies" }] },
  { group: "Institution", items: [{ href: "/admin/students", label: "Students" }, { href: "/admin/policies", label: "Policies" }] },
  { group: "Administration", items: [{ href: "/admin/reports", label: "Reports" }, { href: "/admin/operations", label: "Operations" }, { href: "/admin/audit", label: "Audit" }] },
] as const;

export function AdminWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [menuOpen]);

  if (pathname === "/admin/sign-in" || pathname.startsWith("/admin/mfa")) return children;

  return (
    <div className={styles.workspace} data-workspace="admin">
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link className={styles.brand} href="/admin/dashboard" aria-label="CampusHire admin home">
            <BrandMark />
            <strong>CampusHire AI</strong>
          </Link>
          <button
            ref={menuButton}
            className={styles.menuButton}
            type="button"
            aria-label={menuOpen ? "Close placement navigation" : "Open placement navigation"}
            aria-expanded={menuOpen}
            aria-controls="placement-navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav
            ref={menu}
            id="placement-navigation"
            className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
            aria-label="Placement operations"
          >
            {navigation.map(group => <div className={styles.group} key={group.group}>
              <p>{group.group}</p>{group.items.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>{item.label}</Link>)}
            </div>)}
          </nav>
          <div className={styles.utilities} aria-label="Administrator utilities">
            <Link className={styles.helpControl} href="/help" aria-label="Open help center"><CircleHelp aria-hidden="true" /></Link>
            <Link
              href="/admin/account"
              aria-label="Open administrator profile and account"
              aria-current={pathname.startsWith("/admin/account") ? "page" : undefined}
            >
              <UserRound aria-hidden="true" />
            </Link>
            <SignOutButton destination="/admin/sign-in" />
          </div>
        </div>
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
