import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Verified registration"
      title="Choose how you use CampusHire."
      description="Student identities are matched to a college invitation, roster, or verified domain. T&P workspaces require institutional verification and operator approval."
      footer={<>Already activated? <Link href="/sign-in">Sign in</Link></>}
    >
      <SignUpForm />
    </AuthShell>
  );
}
