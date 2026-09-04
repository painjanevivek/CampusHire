import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";

export default function MfaSetupPage() {
  return <AuthShell context="admin" eyebrow="Administrator security" title="Protect placement operations with an authenticator." description="T&P access requires a rotating code. Recovery codes provide a one-time fallback." footer={<a href="/admin/sign-in">Use another account</a>}><MfaForm mode="setup" /></AuthShell>;
}
