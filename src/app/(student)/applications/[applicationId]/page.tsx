import { StudentWorkspace } from "@/components/layout/student-workspace";
import { StudentApplicationDetail } from "@/features/recruitment/student-application-detail";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <StudentWorkspace active="Applications"><StudentApplicationDetail applicationId={applicationId} /></StudentWorkspace>;
}
