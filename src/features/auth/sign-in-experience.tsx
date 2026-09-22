"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { AccountRoleSwitch, type SignInRole } from "@/features/auth/account-role-switch";
import { safeReturnTo } from "@/lib/auth/return-to";

const rolePaths: Record<SignInRole, string> = {
  student: "/sign-in",
  tnp: "/tnp/sign-in",
  admin: "/admin/sign-in",
};

type RoleCopy = {
  eyebrow: string;
  description: string;
  fallback: string;
  allowedPrefix?: string;
  footer: ReactNode;
};

const roleCopy: Record<SignInRole, RoleCopy> = {
  student: {
    eyebrow: "Welcome back",
    description: "Choose your workspace, then use the email and password connected to your account.",
    fallback: "/dashboard",
    footer: <>Need a student account? <Link href="/sign-up?from=/sign-in">Sign up</Link></>,
  },
  tnp: {
    eyebrow: "Training & Placement workspace",
    description: "Use the username and password issued for your institution. If you enabled an authenticator, verification follows the password.",
    fallback: "/tnp/dashboard",
    allowedPrefix: "/tnp/",
    footer: <>Need access? Ask your institution to contact the CampusHire Platform Admin.</>,
  },
  admin: {
    eyebrow: "Platform administration",
    description: "Use the single Platform Admin account for institution access, service oversight, and platform configuration.",
    fallback: "/admin/dashboard",
    allowedPrefix: "/admin/",
    footer: <>Institution placement decisions remain with authorised T&amp;P Officers.</>,
  },
};

export function SignInExperience({
  initialRole,
  returnTo,
}: {
  initialRole: SignInRole;
  returnTo?: string;
}) {
  const [role, setRole] = useState(initialRole);
  const copy = roleCopy[role];

  function switchRole(nextRole: SignInRole) {
    if (nextRole === role) return;

    setRole(nextRole);
    window.history.replaceState(
      null,
      "",
      `${rolePaths[nextRole]}${window.location.search}${window.location.hash}`,
    );
  }

  return (
    <AuthShell
      wide
      context={role === "student" ? "student" : "admin"}
      backHref="/"
      backLabel="Back to home"
      eyebrow={copy.eyebrow}
      title="Sign in to CampusHire."
      description={copy.description}
      footer={copy.footer}
    >
      <AccountRoleSwitch current={role} onRoleChange={switchRole} />
      <AuthForm
        key={role}
        workspace={role}
        redirectTo={safeReturnTo(returnTo, copy.fallback, copy.allowedPrefix)}
      />
    </AuthShell>
  );
}
