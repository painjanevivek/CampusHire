import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminOperations } from "./admin-operations";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const job = {
  id: "11111111-1111-1111-1111-111111111111",
  resume_version_id: "22222222-2222-2222-2222-222222222222",
  status: "queued",
  attempts: 0,
  max_attempts: 3,
  available_at: "2026-08-24T00:00:00Z",
  started_at: null,
  heartbeat_at: null,
  lease_expires_at: null,
  claimed_by: null,
  cancellation_requested_at: null,
  finished_at: null,
  duration_ms: null,
  safe_error_code: null,
  events: [{
    id: "event-1",
    event_type: "queued",
    status: "queued",
    attempt: 0,
    worker_id: null,
    safe_error_code: null,
    correlation_id: "request-1234",
    occurred_at: "2026-08-24T00:00:00Z",
  }],
};

describe("AdminOperations", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/admin/operations/summary") {
        return Promise.resolve({
          active_leases: 0,
          exhausted_failures: 0,
          oldest_queued_age_seconds: 12,
          status_counts: { queued: 1 },
        });
      }
      return Promise.resolve({ items: [job], total: 1 });
    });
    csrfRequestMock.mockResolvedValue({ ...job, status: "cancelled" });
  });

  it("shows tenant-safe job health and records operator cancellation", async () => {
    render(<AdminOperations />);

    expect(await screen.findByRole("heading", { name: "Background jobs" }))
      .toBeInTheDocument();
    expect(await screen.findByText("12s")).toBeInTheDocument();
    expect(screen.getByText("Resume job 11111111")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel job" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/admin/operations/resume-jobs/11111111-1111-1111-1111-111111111111/cancel",
      { method: "POST" },
    ));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "cancellation was recorded",
    );
  });
});
