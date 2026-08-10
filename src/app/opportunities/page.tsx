import { StudentWorkspace } from "@/components/layout/student-workspace";
import { OpportunitiesWorkspace } from "@/features/opportunities/opportunities-workspace";

export default function OpportunitiesPage() {
  return (
    <StudentWorkspace active="Opportunities">
      <OpportunitiesWorkspace />
    </StudentWorkspace>
  );
}
