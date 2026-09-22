"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Building2, GraduationCap, ShieldCheck } from "lucide-react";

export type SignInRole = "student" | "tnp" | "admin";

type AccountRoleSwitchProps = {
  current: SignInRole;
  onRoleChange?: (role: SignInRole) => void;
};

const rolePaths: Record<SignInRole, string> = {
  student: "/sign-in",
  tnp: "/tnp/sign-in",
  admin: "/admin/sign-in",
};

export function AccountRoleSwitch({ current, onRoleChange }: AccountRoleSwitchProps) {
  function changeRole(event: MouseEvent<HTMLAnchorElement>, role: SignInRole) {
    if (
      !onRoleChange
      || event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onRoleChange(role);
  }

  return (
    <nav className="accountRoleSwitch" aria-label="Choose sign-in account">
      <Link href={rolePaths.student} replace aria-current={current === "student" ? "page" : undefined} onClick={(event) => changeRole(event, "student")}>
        <GraduationCap aria-hidden="true" />
        <span><strong>Student</strong><small>Open your placement workspace</small></span>
      </Link>
      <Link href={rolePaths.tnp} replace aria-current={current === "tnp" ? "page" : undefined} onClick={(event) => changeRole(event, "tnp")}>
        <Building2 aria-hidden="true" />
        <span><strong>Training &amp; Placement</strong><small>Use your assigned officer account</small></span>
      </Link>
      <Link href={rolePaths.admin} replace aria-current={current === "admin" ? "page" : undefined} onClick={(event) => changeRole(event, "admin")}>
        <ShieldCheck aria-hidden="true" />
        <span><strong>Admin</strong><small>Manage access and T&amp;P accounts</small></span>
      </Link>
    </nav>
  );
}
