import { StudentWorkspace } from "@/components/layout/student-workspace";
import { OpportunityDetail } from "@/features/opportunities/opportunity-detail";

export default function RoleDetailPage() {
  return <StudentWorkspace active="Opportunities"><OpportunityDetail /></StudentWorkspace>;
}
