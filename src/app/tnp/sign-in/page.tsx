import { AuthShell } from "@/components/layout/auth-shell";
import { AccountRoleSwitch } from "@/features/auth/account-role-switch";
import { AuthForm } from "@/features/auth/auth-form";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function TnpSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <AuthShell
      wide
      context="admin"
      backHref="/"
      backLabel="Back to home"
      eyebrow="Training & Placement workspace"
      title="Sign in to CampusHire."
      description="Use the username and password issued by your institution Admin. Authenticator verification follows the password."
      footer={<>Need access? Contact your institution Admin.</>}
    >
      <AccountRoleSwitch current="tnp" />
      <AuthForm
        workspace="tnp"
        redirectTo={safeReturnTo(returnTo, "/admin/dashboard", "/admin/")}
      />
    </AuthShell>
  );
}
