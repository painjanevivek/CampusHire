import { AuthShell } from "@/components/layout/auth-shell";
import { InstitutionVerification } from "@/features/auth/institution-verification";

export default async function InstitutionVerificationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell
      context="admin"
      eyebrow="Institution verification"
      title="Verify your institutional email."
      description="Verification confirms control of the submitted email. CampusHire still reviews the institution and duplicate signals before access is issued."
      footer={<>T&amp;P access remains inactive until approval and onboarding are complete.</>}
    >
      <InstitutionVerification token={token} />
    </AuthShell>
  );
}
