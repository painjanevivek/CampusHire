"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, ClipboardList, Home, ListChecks, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { NotificationCenter } from "@/features/engagement/notification-center";
import { ProfileMenu } from "./profile-menu";

import styles from "./student-header.module.css";

type WorkspaceSection =
  "Home" | "Opportunities" | "Applications" | "Preparation";

const navigation: Array<{ href: string; label: WorkspaceSection }> = [
  { href: "/dashboard", label: "Home" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/applications", label: "Applications" },
  { href: "/preparation", label: "Preparation" },
];
const navigationIcons = { Home, Opportunities: BriefcaseBusiness, Applications: ClipboardList, Preparation: ListChecks };

export function StudentHeader() {
  const pathname = usePathname();
  const [surface, setSurface] = useState<"navigation" | "profile" | "notifications" | null>(null);
  const menuOpen = surface === "navigation";
  const setMenuOpen = useCallback((open: boolean) => setSurface(open ? "navigation" : null), []);
  const setProfileOpen = useCallback((open: boolean) => setSurface(current => open ? "profile" : current === "profile" ? null : current), []);
  const setNotificationsOpen = useCallback((open: boolean) => setSurface(current => open ? "notifications" : current === "notifications" ? null : current), []);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenuOpen(false); menuButton.current?.focus(); }
    }
    window.addEventListener("keydown", closeOnEscape);
    function closeOutside(event: PointerEvent) {
      if (!menu.current?.contains(event.target as Node) && !menuButton.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => { window.removeEventListener("keydown", closeOnEscape); document.removeEventListener("pointerdown", closeOutside); };
  }, [menuOpen, setMenuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/" aria-label="CampusHire home">
          <BrandMark />
          <strong>CampusHire</strong>
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
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          ref={menu}
          id="student-navigation"
          className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
          aria-label="Student navigation"
          onBlur={event => { if (menuOpen && !event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false); }}
        >
          {navigation.map(({ href, label }) => {
            const Icon = navigationIcons[label];
            const selected = pathname === href || pathname.startsWith(`${href}/`) || (href === "/preparation" && ["/resume", "/roadmap"].some(path => pathname.startsWith(path)));
            return (
              <Link
                key={label}
                href={href}
                aria-current={selected ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} aria-hidden="true" />{label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.utilities}>
          <NotificationCenter open={surface === "notifications"} onOpenChange={setNotificationsOpen} />
          <ProfileMenu open={surface === "profile"} onChange={setProfileOpen} />
        </div>
      </div>
    </header>
  );
}
