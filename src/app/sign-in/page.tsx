import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { AccountRoleSwitch } from "@/features/auth/account-role-switch";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthShell wide backHref="/" backLabel="Back to home" eyebrow="Welcome back" title="Sign in to CampusHire." description="Choose your workspace, then use the email and password connected to your account." footer={<>Need a student account? <Link href="/sign-up?from=/sign-in">Sign up</Link></>}><AccountRoleSwitch current="student" /><AuthForm workspace="student" redirectTo={safeReturnTo(returnTo, "/dashboard")} /></AuthShell>;
}
