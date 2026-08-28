import { AuthShell } from "@/components/layout/auth-shell";
import { PasswordResetForm } from "@/features/auth/password-reset-form";

export default function ForgotPasswordPage() {
  return <AuthShell eyebrow="Account recovery" title="Reset your password securely." description="For privacy, the result is the same whether or not an account exists." footer={<a href="/sign-in">Return to sign in</a>}><PasswordResetForm /></AuthShell>;
}
