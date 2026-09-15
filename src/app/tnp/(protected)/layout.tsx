import type { ReactNode } from "react";

import { TnpWorkspace } from "@/components/layout/admin-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function ProtectedTnpLayout({ children }: { children: ReactNode }) {
  const user = await requireServerSession("tnp");
  return <TnpWorkspace role={user.role}>{children}</TnpWorkspace>;
}
