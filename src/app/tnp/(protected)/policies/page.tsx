import { AdminPolicies } from "@/features/recruitment/admin-policies";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function TnpPoliciesPage() {
  const user = await requireServerSession("tnp");
  return <AdminPolicies role={user.role} />;
}
