import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function StudentMfaSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeReturnTo(next, "/dashboard");
  return (
    <AuthShell
      eyebrow="Student account security"
      title="Add an authenticator when you’re ready."
      description="Authenticator setup is optional. Once enabled, sign-ins require a rotating code, with one-time recovery codes as a fallback."
      footer={<a href="/sign-in">Use another account</a>}
    >
      <MfaForm mode="setup" nextPath={nextPath} />
    </AuthShell>
  );
}
