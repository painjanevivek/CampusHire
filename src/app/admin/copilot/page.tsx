import { redirect } from "next/navigation";

import { requireServerSession } from "@/lib/auth/server-session";

export default async function LegacyAdminCopilotPage() {
  await requireServerSession("admin");
  redirect("/admin/settings");
}
