import type { ReactNode } from "react";

import { AdminWorkspace } from "@/components/layout/admin-workspace";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminWorkspace>{children}</AdminWorkspace>;
}
