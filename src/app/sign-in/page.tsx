import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";

function safeReturnTo(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") && !/[\\\r\n]/.test(value) ? value : undefined;
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <AuthShell eyebrow="Welcome back" title="Continue your placement plan." description="Use the email and password connected to your CampusHire account." footer={<>Need an account? <a href="/sign-up">Request an institution invitation</a></>}><AuthForm mode="sign-in" redirectTo={safeReturnTo(returnTo)} /></AuthShell>;
}
