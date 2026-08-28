import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";

function safeReturnTo(value?: string) {
  return value?.startsWith("/admin/") && !/[\\\r\n]/.test(value) ? value : "/admin/dashboard";
}

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthShell eyebrow="T&P workspace" title="Manage placements with an assigned account." description="Administrator access is invitation-only and requires an authenticator check after your password." footer={<a href="/sign-in">Use a student account</a>}><AuthForm mode="sign-in" redirectTo={safeReturnTo(returnTo)} /></AuthShell>;
}
