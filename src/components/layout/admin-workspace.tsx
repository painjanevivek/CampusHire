"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Menu, X } from "lucide-react";

import styles from "./admin-workspace.module.css";
import { SignOutButton } from "./sign-out-button";

const navigation = [
  { href: "/admin/drives", label: "Drives" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/policies", label: "Policies" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/audit", label: "Audit" },
] as const;

export function AdminWorkspace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/admin/sign-in" || pathname.startsWith("/admin/mfa")) return children;

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link className={styles.brand} href="/admin/dashboard" aria-label="CampusHire admin home">
            <span aria-hidden="true">C</span>
            <strong>CampusHire AI</strong>
          </Link>
          <button
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
            id="placement-navigation"
            className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
            aria-label="Placement operations"
          >
            {navigation.map((item) => {
              const selected = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} aria-current={selected ? "page" : undefined}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className={styles.utilities} aria-label="Administrator utilities">
            <Link href="/help" aria-label="Open help center"><CircleHelp aria-hidden="true" /></Link>
            <SignOutButton destination="/admin/sign-in" />
          </div>
        </div>
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
