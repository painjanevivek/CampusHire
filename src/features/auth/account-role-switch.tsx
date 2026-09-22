import Link from "next/link";
import { Building2, GraduationCap, ShieldCheck } from "lucide-react";

type AccountRoleSwitchProps = {
  current: "student" | "tnp" | "admin";
};

export function AccountRoleSwitch({ current }: AccountRoleSwitchProps) {
  return (
    <nav className="accountRoleSwitch" aria-label="Choose sign-in account">
      <Link href="/sign-in" replace aria-current={current === "student" ? "page" : undefined}>
        <GraduationCap aria-hidden="true" />
        <span><strong>Student</strong><small>Open your placement workspace</small></span>
      </Link>
      <Link href="/tnp/sign-in" replace aria-current={current === "tnp" ? "page" : undefined}>
        <Building2 aria-hidden="true" />
        <span><strong>Training &amp; Placement</strong><small>Use your assigned officer account</small></span>
      </Link>
      <Link href="/admin/sign-in" replace aria-current={current === "admin" ? "page" : undefined}>
        <ShieldCheck aria-hidden="true" />
        <span><strong>Admin</strong><small>Manage access and T&amp;P accounts</small></span>
      </Link>
    </nav>
  );
}
