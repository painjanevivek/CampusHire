import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { StudentWorkspace } from "@/components/layout/student-workspace";

export default function OnboardingPage() {
  return <StudentWorkspace active="Profile"><OnboardingWizard /></StudentWorkspace>;
}

