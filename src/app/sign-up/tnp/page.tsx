import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { InstitutionSignUpForm } from "@/features/auth/institution-sign-up-form";

export default function InstitutionSignUpPage() {
  return (
    <AuthShell
      context="admin"
      eyebrow="Institution registration"
      title="Request a CampusHire workspace."
      description="Submit the institution details used for domain verification and operator review."
      footer={<>Joining as a student? <Link href="/sign-up">Student sign-up</Link></>}
    >
      <InstitutionSignUpForm />
    </AuthShell>
  );
}
