import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function TnpMfaSetupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = safeReturnTo(next, "/tnp/dashboard", "/tnp/");
  return <AuthShell context="admin" eyebrow="T&P account security" title="Add an authenticator when you are ready." description="MFA is optional until you enrol it. After setup, this account requires a rotating code; recovery codes remain a one-time fallback."><MfaForm mode="setup" nextPath={nextPath} /></AuthShell>;
}
