import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function StudentMfaChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeReturnTo(next, "/dashboard");
  return (
    <AuthShell
      eyebrow="Student account security"
      title="Verify your sign-in."
      description="Enter the 6-digit code from your authenticator app. You can also use one of your recovery codes."
      footer={<a href="/sign-in">Use another account</a>}
    >
      <MfaForm mode="challenge" nextPath={nextPath} />
    </AuthShell>
  );
}
