import { AuthShell } from "@/components/layout/auth-shell";
import { RecoveryCodeForm } from "@/features/auth/recovery-code-form";

export default function ManualResetPasswordPage() {
  return <AuthShell eyebrow="Account recovery" title="Enter your recovery code." description="A one-time code lets you set your own new password. Your placement office must verify your identity before issuing one." footer={<a href="/sign-in">Return to sign in</a>}><RecoveryCodeForm /></AuthShell>;
}
