import { AuthShell } from "@/components/layout/auth-shell";
import { InvitationActivationForm } from "@/features/auth/invitation-activation-form";

export default async function ActivationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell eyebrow="Verified invitation" title="Activate your CampusHire account." description="Confirm the invitation, choose a password, and review the policies tied to this account." footer={<a href="/sign-in">Already activated? Sign in</a>}>
      <InvitationActivationForm token={token} />
    </AuthShell>
  );
}
