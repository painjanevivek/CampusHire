import { SignInExperience } from "@/features/auth/sign-in-experience";

export default async function TnpSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  return <SignInExperience initialRole="tnp" returnTo={returnTo} />;
}
