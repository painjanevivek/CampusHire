import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Student registration"
      title="Create your CampusHire account."
      description="Create your student account with a verified college email, then continue directly to your profile."
      footer={<>Already have an account? <Link href="/sign-in">Sign in</Link></>}
      centered
    >
      <SignUpForm />
    </AuthShell>
  );
}
