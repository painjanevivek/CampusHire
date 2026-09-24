import type { ReactNode } from "react";
import { headers } from "next/headers";

import { StudentWorkspace } from "@/components/layout/student-workspace";
import { getStudentOnboardingStatus } from "@/lib/auth/student-onboarding-access";
import { requiresPlacementAccess } from "@/lib/auth/placement-route-guard";
import { requireServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { PlacementAccessUnavailable } from "@/components/placement-access-unavailable";

export default async function StudentRouteLayout({ children }: { children: ReactNode }) {
  const [user, requestHeaders] = await Promise.all([
    requireServerSession("student"),
    headers(),
  ]);
  const onboarding = await getStudentOnboardingStatus();
  if (!onboarding.completed) redirect("/onboarding");
  const route = requestHeaders.get("x-campushire-return-to")?.split("?")[0] ?? "/dashboard";
  const placementAccess = user.placement_access?.available === true;
  if (!placementAccess && requiresPlacementAccess(route)) {
    return (
      <StudentWorkspace placementAccess={false}>
        <PlacementAccessUnavailable
          studyYear={user.placement_access?.study_year ?? null}
          verificationRequired={user.placement_access?.verification_required === true}
        />
      </StudentWorkspace>
    );
  }
  return <StudentWorkspace placementAccess={placementAccess}>{children}</StudentWorkspace>;
}
