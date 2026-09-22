import { SignInExperience } from "@/features/auth/sign-in-experience";

export default async function AdminSignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <SignInExperience initialRole="admin" returnTo={returnTo} />;
}
