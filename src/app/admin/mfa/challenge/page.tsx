import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";

export default function MfaChallengePage() {
  return <AuthShell context="admin" eyebrow="Administrator verification" title="Enter your authenticator code." description="This second step protects student records and placement decisions."><MfaForm mode="challenge" /></AuthShell>;
}
