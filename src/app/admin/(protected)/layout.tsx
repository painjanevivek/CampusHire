import type { ReactNode } from "react";

import { requireServerSession } from "@/lib/auth/server-session";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  await requireServerSession("admin");
  return children;
}
