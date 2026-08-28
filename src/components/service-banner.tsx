"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";

type ServiceStatus = {
  status: "operational" | "maintenance";
  maintenance_message: string | null;
  transactional_email: "configured" | "degraded";
};

export function ServiceBanner() {
  const [service, setService] = useState<ServiceStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest<ServiceStatus>("/service-status", { signal: controller.signal })
      .then(setService)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (!service || service.status === "operational") return null;
  return (
    <aside className="serviceBanner" role="status" aria-live="polite">
      <strong>Planned maintenance</strong>
      <span>{service.maintenance_message ?? "Some services are temporarily limited."}</span>
      <a href="/status">View service status</a>
    </aside>
  );
}
