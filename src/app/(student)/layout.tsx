import type { ReactNode } from "react";

import { StudentWorkspace } from "@/components/layout/student-workspace";
import { requireServerSession } from "@/lib/auth/server-session";

export default async function StudentRouteLayout({ children }: { children: ReactNode }) {
  await requireServerSession("student");
  return <StudentWorkspace>{children}</StudentWorkspace>;
}
