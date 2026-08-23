import { StudentWorkspace } from "@/components/layout/student-workspace";
import { StudentOpportunities } from "@/features/recruitment/student-opportunities";

export default function OpportunitiesPage() {
  return (
    <StudentWorkspace active="Opportunities">
      <StudentOpportunities />
    </StudentWorkspace>
  );
}
