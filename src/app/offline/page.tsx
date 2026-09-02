import { ButtonLink } from "@/components/ui/button";
import { safeReturnTo } from "@/lib/auth/return-to";

export default async function OfflinePage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const retryTarget = safeReturnTo(returnTo, "/");
  return <main id="main-content" className="statePage"><p className="eyebrow">Connection unavailable</p><h1>Your work is still here.</h1><p>Reconnect to save new changes and refresh placement information.</p><ButtonLink href={retryTarget}>Try again</ButtonLink></main>;
}
