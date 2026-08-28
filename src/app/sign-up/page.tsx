import { AuthShell } from "@/components/layout/auth-shell";
import { ButtonLink } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Institution enrollment"
      title="CampusHire accounts begin with an invitation."
      description="Your college placement office verifies its roster and sends a one-time activation link to your registered email. Public account creation is not available."
      footer={<>Already activated? <a href="/sign-in">Sign in</a></>}
    >
      <div className="authForm">
        <p>Ask your placement office to confirm the email and enrollment ID on its CampusHire roster.</p>
        <ButtonLink href="/">See how CampusHire works</ButtonLink>
      </div>
    </AuthShell>
  );
}
