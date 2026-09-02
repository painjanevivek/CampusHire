import type { Metadata } from "next";
import { ContentPage } from "@/features/content/content-page";
import { apiRequest } from "@/lib/api/client";

type ServiceStatus = {
  status: "operational" | "maintenance";
  maintenance_message: string | null;
  transactional_email: "configured" | "degraded";
};

export const metadata: Metadata = { title: "Service status", alternates: { canonical: "/status" } };

export default async function StatusPage() {
  const service = await apiRequest<ServiceStatus>("/service-status", {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(2_000),
  }).catch(() => null);
  const summary = !service
    ? "Live status could not be reached. Your saved records are unaffected; retry shortly."
    : service.status === "maintenance"
      ? (service.maintenance_message ?? "Some services are temporarily limited.")
      : service.transactional_email === "degraded"
        ? "Core records are operational. Transactional email is delayed."
        : "All reported services are operational.";
  const emailState = service?.transactional_email === "configured"
    ? "Transactional account and placement email is configured. Optional reminders may still pause near the approved quota."
    : "Transactional email is delayed or not configured. In-product account and placement records remain authoritative.";

  return <ContentPage eyebrow="Service status" title="Core placement records come first." introduction="CampusHire shows planned maintenance and email degradation without presenting optional services as official placement records." summary={summary} sections={[{ title: "Core records", body: "Sign-in, verified profiles, rule-based eligibility, applications, and audit records are treated as essential services." }, { title: "Account email", body: emailState }, { title: "AI assistance", body: "Skills matching and suggestions can stop on their own. This never changes eligibility, application status, or administrator records." }, { title: "If something goes wrong", body: "Try the visible action once more. Keep the support reference if one appears, then use the Help center without adding personal data." }]} />;
}
