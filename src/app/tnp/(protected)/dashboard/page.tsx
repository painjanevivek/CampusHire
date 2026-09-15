import { AdminOverview } from "@/features/recruitment/admin-overview";
import { ReviewerDashboard } from "@/features/recruitment/reviewer-dashboard";
import { requireServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function TnpDashboardPage() {
  const user = await requireServerSession("tnp");
  if (user.role === "tnp_auditor") redirect("/tnp/reports");
  if (user.role === "tnp_reviewer") return <ReviewerDashboard />;
  return <AdminOverview />;
}
