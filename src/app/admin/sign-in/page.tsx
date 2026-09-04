import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const demoRole = process.env.DEMO_LOGIN_ENABLED === "true" ? "tnp_admin" : undefined;
  return <AuthShell context="admin" eyebrow="T&P workspace" title="Manage placements with an assigned account." description="Administrator access is invitation-only and requires an authenticator check after your password." footer={<a href="/sign-in">Use a student account</a>}><AuthForm redirectTo={safeReturnTo(returnTo, "/admin/dashboard", "/admin/")} demoRole={demoRole} /></AuthShell>;
}
