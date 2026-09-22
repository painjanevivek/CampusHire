import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string }>;
}) {
  const { from } = searchParams ? await searchParams : {};
  const backHref = safeReturnTo(from, "/sign-in");

  return (
    <AuthShell
      backHref={backHref}
      eyebrow="Student registration"
      title="Create your CampusHire account."
      description="Use your college email. If you have an invitation code from your placement office, you can activate your account now; otherwise, submit a request for review."
      footer={<>Already have an account? <Link href="/sign-in">Sign in</Link></>}
    >
      <SignUpForm />
    </AuthShell>
  );
}
