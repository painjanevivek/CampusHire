import { AuthShell } from "@/components/layout/auth-shell";
import { MfaForm } from "@/features/auth/mfa-form";

export default function TnpMfaChallengePage() {
  return <AuthShell context="admin" eyebrow="T&P verification" title="Enter your authenticator code." description="This second step protects institution placement records." footer={<a href="/tnp/sign-in">Use another account</a>}><MfaForm mode="challenge" nextPath="/tnp/dashboard" /></AuthShell>;
}
