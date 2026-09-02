import { apiRequest } from "@/lib/api/client";

type ServiceStatus = {
  status: "operational" | "maintenance";
  maintenance_message: string | null;
  transactional_email: "configured" | "degraded";
};

export async function ServiceBanner() {
  const service = await apiRequest<ServiceStatus>("/service-status", {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(2_000),
  }).catch(() => null);
  if (
    !service ||
    (service.status === "operational" && service.transactional_email === "configured")
  ) {
    return null;
  }
  const maintenance = service.status === "maintenance";
  return (
    <aside className="serviceBanner" role="status" aria-live="polite">
      <strong>{maintenance ? "Planned maintenance" : "Email delivery delayed"}</strong>
      <span>
        {maintenance
          ? (service.maintenance_message ?? "Some services are temporarily limited.")
          : "Account and placement records remain available. Messages may arrive later than usual."}
      </span>
      <a href="/status">View service status</a>
    </aside>
  );
}
