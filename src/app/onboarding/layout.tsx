import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { StudentWorkspace } from "@/components/layout/student-workspace";
import { getStudentOnboardingStatus } from "@/lib/auth/student-onboarding-access";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function StudentOnboardingLayout({ children }: { children: ReactNode }) {
  await requireServerSession("student");
  const onboarding = await getStudentOnboardingStatus();
  if (onboarding.completed) redirect("/dashboard");
  return <StudentWorkspace>{children}</StudentWorkspace>;
}
