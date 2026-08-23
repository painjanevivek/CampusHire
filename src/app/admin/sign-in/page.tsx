import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";

export default function AdminSignInPage() {
  return <AuthShell eyebrow="TNP workspace" title="Manage placements with an assigned account." description="Administrator access is invitation-only. Student accounts cannot enter the TNP workspace." footer={<a href="/sign-in">Use a student account</a>}><AuthForm mode="sign-in" redirectTo="/admin/dashboard" /></AuthShell>;
}
