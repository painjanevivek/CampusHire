import { AdminAccountWorkspace } from "@/features/profile/admin-account-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function TnpAccountPage() {
  const user = await requireServerSession("tnp");
  return <AdminAccountWorkspace user={user} />;
}
