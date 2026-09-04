import { StudentApplicationDetail } from "@/features/recruitment/student-application-detail";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <StudentApplicationDetail applicationId={applicationId} />;
}
