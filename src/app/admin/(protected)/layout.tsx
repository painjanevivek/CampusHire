import type { ReactNode } from "react";

import { AdminWorkspace } from "@/components/layout/admin-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const user = await requireServerSession("admin");
  return <AdminWorkspace role={user.role}>{children}</AdminWorkspace>;
}
