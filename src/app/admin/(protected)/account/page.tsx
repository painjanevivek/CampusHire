import { AdminAccountWorkspace } from "@/features/profile/admin-account-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function AdminAccountPage() {
  const user = await requireServerSession("admin");
  return <AdminAccountWorkspace user={user} />;
}
