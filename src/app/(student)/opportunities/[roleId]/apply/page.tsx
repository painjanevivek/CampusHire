import { ApplicationWizard } from "@/features/recruitment/application-wizard";
import { notFound } from "next/navigation";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
  if (roleId === "demo") notFound();
  return <ApplicationWizard roleId={roleId} />;
}
