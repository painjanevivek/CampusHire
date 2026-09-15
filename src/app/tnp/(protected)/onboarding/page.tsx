import { InstitutionOnboardingWizard } from "@/features/onboarding/institution-onboarding-wizard";
import { requireServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function TnpOnboardingPage() {
  const user = await requireServerSession("tnp");
  if (user.role !== "tnp_owner") redirect("/tnp/dashboard");
  return <InstitutionOnboardingWizard />;
}
