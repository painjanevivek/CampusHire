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
    window.sessionStorage.clear();
    apiRequestMock.mockReset().mockImplementation((path: string) => {
      if (path === "/auth/me") {
        return Promise.resolve({ id: "admin-1", institution_id: "institution-1" });
      }
      return Promise.resolve({
        items: [{
          id: "audit-1",
          actor_user_id: "actor-1",
          event_type: "application.status_changed",
          resource_type: "application",
          resource_id: "application-1",
          outcome: "success",
          reason: "Details reviewed",
          correlation_id: "correlation-1",
          details: { status: "shortlisted" },
          created_at: "2026-08-28T10:00:00Z",
        }],
        page: 1,
        page_size: 25,
        total: 1,
      });
    });
  });

  it("filters, progressively discloses safe metadata, and exports the active view", async () => {
    render(<AdminAudit />);

    expect(await screen.findByText("application.status changed")).toBeInTheDocument();
    expect(screen.getByText("Details reviewed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export filtered CSV" })).toHaveAttribute(
      "href",
      expect.stringContaining("/admin/audit/export.csv"),
    );

    fireEvent.change(screen.getByLabelText("Action"), { target: { value: "drive.published" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("action=drive.published"),
      { cache: "no-store" },
    ));
    fireEvent.click(screen.getByRole("button", { name: /Save view/ }));
    await waitFor(() => expect(window.sessionStorage.getItem(
      "campushire.admin.audit-view.admin-1.institution-1",
    )).toContain("drive.published"));
    expect(window.localStorage.getItem("campushire.admin.audit-view")).toBeNull();
  });

  it("rechecks the account namespace before restoring a view", async () => {
    let currentUser = { id: "admin-1", institution_id: "institution-1" };
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/auth/me") return Promise.resolve(currentUser);
      return Promise.resolve({ items: [], page: 1, page_size: 25, total: 0 });
    });
    window.sessionStorage.setItem(
      "campushire.admin.audit-view.admin-1.institution-1",
      JSON.stringify({ action: "account-a-action" }),
    );
    window.sessionStorage.setItem(
      "campushire.admin.audit-view.admin-2.institution-2",
      JSON.stringify({ action: "account-b-action" }),
    );
    render(<AdminAudit />);
    await screen.findByText("No audit events match");

    currentUser = { id: "admin-2", institution_id: "institution-2" };
    fireEvent.click(screen.getByRole("button", { name: "Restore view" }));

    await waitFor(() => expect(screen.getByLabelText("Action")).toHaveValue("account-b-action"));
    expect(screen.getByLabelText("Action")).not.toHaveValue("account-a-action");
  });
});
