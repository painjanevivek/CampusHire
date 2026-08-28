import { StudentWorkspace } from "@/components/layout/student-workspace";
import { StudentOpportunityDetail } from "@/features/recruitment/student-opportunity-detail";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  return (
    <StudentWorkspace active="Opportunities">
      <StudentOpportunityDetail roleId={roleId} />
    </StudentWorkspace>
  );
}

