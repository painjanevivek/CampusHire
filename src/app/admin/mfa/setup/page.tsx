import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function MfaSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeReturnTo(next, "/admin/dashboard", "/admin/");
  return <AuthShell context="admin" eyebrow="Platform Admin security" title="Add an authenticator when you are ready." description="MFA is optional until you enrol it. After setup, Platform Admin access requires a rotating code and recovery codes provide a one-time fallback." footer={<a href="/admin/sign-in">Use another account</a>}><MfaForm mode="setup" nextPath={nextPath} /></AuthShell>;
}
