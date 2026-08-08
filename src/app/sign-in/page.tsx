import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";

export default function SignInPage() {
  return <AuthShell eyebrow="Welcome back" title="Continue your placement plan." description="Use the email and password connected to your CampusHire account." footer={<>New to CampusHire? <a href="/sign-up">Create an account</a></>}><AuthForm mode="sign-in" /></AuthShell>;
}
