import { StudentOpportunityDetail } from "@/features/recruitment/student-opportunity-detail";
import { notFound } from "next/navigation";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  if (roleId === "demo") notFound();
  return <StudentOpportunityDetail roleId={roleId} />;
}
