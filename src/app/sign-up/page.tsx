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
  const resolvedBackHref = backHref === "/sign-in" ? "/" : backHref;

  return (
    <AuthShell
      backHref={resolvedBackHref}
      backLabel={resolvedBackHref === "/" ? "Back to home" : "Go back"}
      eyebrow="Student registration"
      title="Create your CampusHire account."
      footer={<>Already have an account? <Link href="/sign-in">Sign in</Link></>}
    >
      <SignUpForm />
    </AuthShell>
  );
}
