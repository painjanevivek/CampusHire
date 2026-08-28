import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";

export default function MfaChallengePage() {
  return <AuthShell eyebrow="Administrator verification" title="Enter your authenticator code." description="This second step protects student records and placement decisions." footer={<a href="/admin/sign-in">Use another account</a>}><MfaForm mode="challenge" /></AuthShell>;
}
