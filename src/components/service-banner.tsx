import { apiRequest } from "@/lib/api/client";

type ServiceStatus = {
  status: "operational" | "maintenance";
  maintenance_message: string | null;
};

export async function ServiceBanner() {
  const service = await apiRequest<ServiceStatus>("/service-status", {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(2_000),
  }).catch(() => null);
  if (!service || service.status !== "maintenance") return null;

  return (
    <aside className="serviceBanner" role="status" aria-live="polite">
      <strong>Planned maintenance</strong>
      <span>{service.maintenance_message ?? "Some services are temporarily limited."}</span>
      <a href="/status">View service status</a>
    </aside>
  );
}
