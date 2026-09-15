import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { AccountRoleSwitch } from "@/features/auth/account-role-switch";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthShell wide context="admin" backHref="/" backLabel="Back to home" eyebrow="Institution administration" title="Sign in to CampusHire." description="Use the institution-owner account that controls student access and provisions T&P officers." footer={<>T&amp;P officer accounts are created inside the Admin dashboard.</>}><AccountRoleSwitch current="admin" /><AuthForm workspace="admin" redirectTo={safeReturnTo(returnTo, "/admin/dashboard", "/admin/")} /></AuthShell>;
}
