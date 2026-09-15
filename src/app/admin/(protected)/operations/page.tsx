import { redirect } from "next/navigation";

export default function OperationsPage() {
  redirect("/admin/system-health");
}
