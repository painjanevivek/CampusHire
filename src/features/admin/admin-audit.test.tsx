import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminAudit } from "./admin-audit";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  apiPath: (path: string) => `https://api.example.test${path}`,
}));

describe("AdminAudit", () => {
  beforeEach(() => {
    window.localStorage.clear();
    apiRequestMock.mockReset().mockResolvedValue({
      items: [{
        id: "audit-1",
        actor_user_id: "actor-1",
        event_type: "application.status_changed",
        resource_type: "application",
        resource_id: "application-1",
        outcome: "success",
        reason: "Evidence reviewed",
        correlation_id: "correlation-1",
        details: { status: "shortlisted" },
        created_at: "2026-08-28T10:00:00Z",
      }],
      page: 1,
      page_size: 25,
      total: 1,
    });
  });

  it("filters, progressively discloses safe metadata, and exports the active view", async () => {
    render(<AdminAudit />);

    expect(await screen.findByText("application.status changed")).toBeInTheDocument();
    expect(screen.getByText("Evidence reviewed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export filtered CSV" })).toHaveAttribute(
      "href",
      expect.stringContaining("/admin/audit/export.csv"),
    );

    fireEvent.change(screen.getByLabelText("Action"), { target: { value: "drive.published" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() => expect(apiRequestMock).toHaveBeenLastCalledWith(
      expect.stringContaining("action=drive.published"),
      { cache: "no-store" },
    ));
    fireEvent.click(screen.getByRole("button", { name: /Save view/ }));
    expect(window.localStorage.getItem("campushire.admin.audit-view")).toContain("drive.published");
  });
});
