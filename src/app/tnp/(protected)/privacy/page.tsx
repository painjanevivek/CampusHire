import { TnpPrivacyWorkspace } from "@/features/privacy/tnp-privacy-workspace";
import { requireServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

export default async function TnpPrivacyPage() {
  const user = await requireServerSession("tnp");
  if (user.role !== "tnp_admin" && user.role !== "tnp_owner") redirect("/tnp/dashboard");
  return <TnpPrivacyWorkspace />;
}
