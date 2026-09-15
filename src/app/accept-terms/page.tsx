import { AuthShell } from "@/components/layout/auth-shell";
import { StaffTermsForm } from "@/features/auth/staff-terms-form";

export default function AcceptTermsPage() {
  return (
    <AuthShell
      context="admin"
      eyebrow="First sign-in"
      title="Review your staff account terms."
      description="Your Admin created the account, but only you can accept the Terms and Privacy Notice for your access."
      footer={<>Acceptance is recorded before authenticator setup.</>}
    >
      <StaffTermsForm />
    </AuthShell>
  );
}
