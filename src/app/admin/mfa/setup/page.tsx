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
  return <AuthShell context="admin" eyebrow="Platform Admin security" title="Add an authenticator when you are ready." backHref="/admin/account" backLabel="Back to account"><MfaForm mode="setup" nextPath={nextPath} /></AuthShell>;
}
