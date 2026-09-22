import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { TnpWorkspace } from "@/components/layout/admin-workspace";
import { requireServerSession } from "@/lib/auth/server-session";
import { canAccessTnpPath, tnpHomeForRole } from "@/lib/auth/workspace-access";

export default async function ProtectedTnpLayout({ children }: { children: ReactNode }) {
  const [user, requestHeaders] = await Promise.all([
    requireServerSession("tnp"),
    headers(),
  ]);
  const returnTo = requestHeaders.get("x-campushire-return-to") ?? "/tnp/dashboard";
  const pathname = returnTo.split("?", 1)[0];
  if (!canAccessTnpPath(user.role, pathname)) redirect(tnpHomeForRole(user.role));
  return <TnpWorkspace role={user.role} institutionId={user.institution_id}>{children}</TnpWorkspace>;
}
