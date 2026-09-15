import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { AccountRoleSwitch } from "@/features/auth/account-role-switch";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthShell wide context="admin" backHref="/" backLabel="Back to home" eyebrow="Platform administration" title="Sign in to CampusHire." description="Use the single Platform Admin account for institution access, service oversight, and platform configuration." footer={<>Institution placement decisions remain with authorised T&amp;P Officers.</>}><AccountRoleSwitch current="admin" /><AuthForm workspace="admin" redirectTo={safeReturnTo(returnTo, "/admin/dashboard", "/admin/")} /></AuthShell>;
}
