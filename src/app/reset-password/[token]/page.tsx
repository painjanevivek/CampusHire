import { AuthShell } from "@/components/layout/auth-shell";
import { PasswordResetForm } from "@/features/auth/password-reset-form";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AuthShell eyebrow="Account recovery" title="Choose a new password." description="Reset links expire and can be used only once. Completing this step signs out every existing session." footer={<a href="/sign-in">Return to sign in</a>}><PasswordResetForm token={token} /></AuthShell>;
}
