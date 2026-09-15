"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileClock,
  FileText,
  Home,
  Menu,
  Settings2,
  ShieldCheck,
  University,
  UserCog,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/features/engagement/notification-center";
import styles from "./admin-workspace.module.css";
import { SignOutButton } from "./sign-out-button";

type WorkspaceVariant = "platform" | "tnp";
type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};
type NavigationGroup = { group: string; items: NavigationItem[] };

const platformNavigation: NavigationGroup[] = [
  {
    group: "Platform",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: Home },
      { href: "/admin/institutions", label: "Institutions", icon: University },
      { href: "/admin/accounts", label: "T&P Accounts", icon: UserCog },
      { href: "/admin/reports", label: "Reports", icon: ChartNoAxesCombined },
    ],
  },
  {
    group: "Administration",
    items: [
      { href: "/admin/system-health", label: "System Health", icon: Activity },
      { href: "/admin/audit", label: "Audit", icon: ShieldCheck },
      { href: "/admin/settings", label: "Settings", icon: Settings2 },
    ],
  },
];

function tnpNavigation(role: string): NavigationGroup[] {
  if (role === "tnp_reviewer") {
    return [{
      group: "Assigned work",
      items: [
        { href: "/tnp/dashboard", label: "Dashboard", icon: Home },
        { href: "/tnp/applications?work_view=my_work", label: "Assigned Reviews", icon: ClipboardList },
        { href: "/tnp/policies", label: "Policies", icon: FileText },
      ],
    }];
  }
  if (role === "tnp_auditor") {
    return [{
      group: "Assurance",
      items: [
        { href: "/tnp/reports", label: "Reports", icon: ChartNoAxesCombined },
        { href: "/tnp/audit", label: "Audit", icon: ShieldCheck },
      ],
    }];
  }
  return [
    {
      group: "Workspace",
      items: [
        { href: "/tnp/dashboard", label: "Dashboard", icon: Home },
        { href: "/tnp/applications", label: "Applications", icon: ClipboardList },
      ],
    },
    {
      group: "Placement operations",
      items: [
        { href: "/tnp/drives", label: "Drives", icon: FileClock },
        { href: "/tnp/companies", label: "Companies", icon: Building2 },
        { href: "/tnp/students", label: "Students", icon: Users },
        { href: "/tnp/reports", label: "Reports", icon: ChartNoAxesCombined },
      ],
    },
    {
      group: "Secondary tools",
      items: [
        { href: "/tnp/policies", label: "Policies", icon: FileText },
        { href: "/tnp/copilot", label: "Copilot", icon: Bot },
      ],
    },
  ];
}

function WorkspaceShell({
  children,
  variant,
  role,
}: {
  children: ReactNode;
  variant: WorkspaceVariant;
  role: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const groups = useMemo(
    () => variant === "platform" ? platformNavigation : tnpNavigation(role),
    [role, variant],
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set([groups[0]?.group ?? "Workspace"]),
  );
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const basePath = variant === "platform" ? "/admin" : "/tnp";
  const workspaceLabel = variant === "platform" ? "Platform administration" : "Placement operations";

  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const close = () => {
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !menuButton.current?.contains(target)) close();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <div className={styles.workspace} data-workspace={variant}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link className={styles.brand} href={`${basePath}/dashboard`} aria-label={`CampusHire ${workspaceLabel} home`}>
            <BrandMark />
            <strong>CampusHire</strong>
          </Link>
          <div className={styles.topUtilities} aria-label="Display and notification controls">
            <ThemeToggle />
            <NotificationCenter context="admin" />
          </div>
          <button
            ref={menuButton}
            className={styles.menuButton}
            type="button"
            aria-label={menuOpen ? `Close ${workspaceLabel} navigation` : `Open ${workspaceLabel} navigation`}
            aria-expanded={menuOpen}
            aria-controls={`${variant}-navigation`}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav
            ref={menu}
            id={`${variant}-navigation`}
            className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`}
            aria-label={workspaceLabel}
          >
            {groups.map((group) => {
              const activeGroup = group.items.some((item) => {
                const itemPath = item.href.split("?")[0];
                return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
              });
              const expanded = activeGroup || expandedGroups.has(group.group);
              const groupId = `${variant}-navigation-${group.group.toLowerCase().replaceAll(" ", "-")}`;
              return (
                <div className={styles.group} key={group.group}>
                  <button
                    className={styles.groupToggle}
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={groupId}
                    onClick={() => setExpandedGroups((current) => {
                      const next = new Set(current);
                      if (next.has(group.group)) next.delete(group.group); else next.add(group.group);
                      return next;
                    })}
                  >
                    <span>{group.group}</span>
                    <ChevronDown aria-hidden="true" />
                  </button>
                  {expanded ? (
                    <div id={groupId} className={styles.groupLinks}>
                      {group.items.map((item) => {
                        const itemPath = item.href.split("?")[0];
                        const selected = pathname === itemPath || pathname.startsWith(`${itemPath}/`);
                        const Icon = item.icon;
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={selected ? "page" : undefined}>
                            <Icon size={17} aria-hidden="true" />{item.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
          <div className={styles.utilities} aria-label={`${workspaceLabel} utilities`}>
            <Link className={styles.helpControl} href="/help" aria-label="Open help center"><CircleHelp aria-hidden="true" /></Link>
            <Link
              href={`${basePath}/account`}
              aria-label="Open profile and account security"
              aria-current={pathname.startsWith(`${basePath}/account`) ? "page" : undefined}
            >
              <UserRound aria-hidden="true" />
            </Link>
            <SignOutButton destination={variant === "platform" ? "/admin/sign-in" : "/tnp/sign-in"} />
          </div>
        </div>
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export function AdminWorkspace({ children, role = "platform_admin" }: { children: ReactNode; role?: string }) {
  return <WorkspaceShell variant="platform" role={role}>{children}</WorkspaceShell>;
}

export function TnpWorkspace({ children, role }: { children: ReactNode; role: string }) {
  return <WorkspaceShell variant="tnp" role={role}>{children}</WorkspaceShell>;
}
