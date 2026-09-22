import { AuthShell } from "@/components/layout/auth-shell";
import { PasswordResetForm } from "@/features/auth/password-reset-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return <AuthShell eyebrow="Account recovery" title="Reset your password securely." description="For privacy, the result is the same whether or not an account exists." footer={<><Link href="/reset-password">Have a one-time recovery code?</Link> · <Link href="/sign-in">Return to sign in</Link></>}><PasswordResetForm /></AuthShell>;
}
