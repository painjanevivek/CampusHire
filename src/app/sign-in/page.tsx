import { SignInExperience } from "@/features/auth/sign-in-experience";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <SignInExperience initialRole="student" returnTo={returnTo} />;
}
