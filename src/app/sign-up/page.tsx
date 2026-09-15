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
      description="Create your student account with a verified college email, then continue directly to your profile."
      footer={<>Already have an account? <Link href="/sign-in">Sign in</Link></>}
    >
      <SignUpForm />
    </AuthShell>
  );
}
