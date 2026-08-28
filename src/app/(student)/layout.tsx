import type { ReactNode } from "react";

import { requireServerSession } from "@/lib/auth/server-session";

export default async function StudentRouteLayout({ children }: { children: ReactNode }) {
  await requireServerSession("student");
  return children;
}
