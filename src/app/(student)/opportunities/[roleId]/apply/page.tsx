import { StudentWorkspace } from "@/components/layout/student-workspace";
import { ApplicationWizard } from "@/features/recruitment/application-wizard";
import { notFound } from "next/navigation";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  if (roleId === "demo") notFound();
  return (
    <StudentWorkspace active="Opportunities">
      <ApplicationWizard roleId={roleId} />
    </StudentWorkspace>
  );
}
