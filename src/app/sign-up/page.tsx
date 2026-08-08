import { AuthShell } from "@/components/layout/auth-shell";
import { AuthForm } from "@/features/auth/auth-form";

export default function SignUpPage() {
  return <AuthShell eyebrow="Student account" title="Start with one secure account." description="Create your login now. You can finish skills, links, and your resume in manageable steps." footer={<>Already registered? <a href="/sign-in">Sign in</a></>}><AuthForm mode="sign-up" /></AuthShell>;
}
