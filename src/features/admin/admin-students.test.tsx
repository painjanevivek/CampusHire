import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminStudents } from "./admin-students";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
  apiPath: (path: string) => `https://api.example.test${path}`,
}));

describe("AdminStudents", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    apiRequestMock.mockReset().mockImplementation((path: string) => {
      if (path === "/auth/me") return Promise.resolve({ id: "admin-1", institution_id: "institution-1" });
      if (path.endsWith("/memberships")) return Promise.resolve([{ id: "membership-1", user_id: "student-1", email: "asha@example.edu", role: "student", status: "active" }]);
      if (path.endsWith("/roster-imports")) return Promise.resolve([{ id: "roster-1", filename: "students.csv", status: "committed", total_rows: 1, valid_rows: 1, invalid_rows: 0, invited_rows: 1, committed_at: "2026-08-28T10:00:00Z", created_at: "2026-08-28T10:00:00Z" }]);
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });
    csrfRequestMock.mockReset().mockResolvedValue({ id: "membership-1", user_id: "student-1", role: "student", status: "graduated" });
  });

  it("connects directory, roster history, safe export, and reasoned status changes", async () => {
    render(<AdminStudents />);

    expect(await screen.findByText("asha@example.edu")).toBeInTheDocument();
    expect(screen.getByText("students.csv")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download template" })).toHaveAttribute(
      "href",
      "https://api.example.test/institutions/institution-1/roster-imports/template",
    );
    expect(screen.getByRole("link", { name: "Export safe CSV" })).toHaveAttribute(
      "href",
      "https://api.example.test/institutions/institution-1/memberships/export.csv",
    );

    fireEvent.click(screen.getByText("Change status"));
    const statusSelectors = screen.getAllByRole("combobox");
    fireEvent.change(statusSelectors.at(-1)!, { target: { value: "graduated" } });
    fireEvent.change(screen.getByPlaceholderText("Reason for audit"), { target: { value: "Program completed" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/institutions/institution-1/memberships/membership-1",
      expect.objectContaining({ method: "PATCH", body: expect.stringContaining("Program completed") }),
    ));
    expect(await screen.findByText("Membership status updated and recorded in Audit.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "asha" } });
    fireEvent.click(screen.getByRole("button", { name: "Save view" }));
    await waitFor(() => expect(window.sessionStorage.getItem(
      "campushire.admin.students-view.admin-1.institution-1",
    )).toContain("asha"));
    expect(window.localStorage.getItem("campushire.admin.students-view")).toBeNull();
  });

  it("loads invitation controls only when disclosed and records resend or revocation", async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/auth/me") return Promise.resolve({ id: "admin-1", institution_id: "institution-1" });
      if (path.endsWith("/memberships") || path.endsWith("/roster-imports")) return Promise.resolve([]);
      if (path.endsWith("/invitations")) return Promise.resolve([{
        id: "invitation-1",
        email: "pending@example.edu",
        enrollment_id: "ENR-001",
        full_name: "Pending Student",
        role: "student",
        status: "pending",
        expires_at: "2026-09-03T10:00:00Z",
        resend_count: 0,
        created_at: "2026-09-02T10:00:00Z",
      }]);
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });
    csrfRequestMock.mockResolvedValue({
      id: "invitation-1",
      status: "revoked",
      expires_at: "2026-09-03T10:00:00Z",
      message: "The invitation was revoked and can no longer be used.",
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<AdminStudents />);
    await screen.findByText("No memberships yet");

    expect(apiRequestMock).not.toHaveBeenCalledWith(
      "/institutions/institution-1/invitations",
      expect.anything(),
    );
    fireEvent.click(screen.getByText("Invitation queue"));
    expect(await screen.findByText(/pending@example\.edu/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Revoke"));
    fireEvent.change(screen.getByLabelText("Audit reason"), {
      target: { value: "Duplicate student record" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm revocation" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/institutions/institution-1/invitations/invitation-1/revoke",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ reason: "Duplicate student record" }),
      }),
    ));
    expect(await screen.findByText("revoked")).toBeInTheDocument();
  });

  it("rechecks the account namespace before restoring a view", async () => {
    let currentUser = { id: "admin-1", institution_id: "institution-1" };
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/auth/me") return Promise.resolve(currentUser);
      if (path.endsWith("/memberships")) return Promise.resolve([]);
      if (path.endsWith("/roster-imports")) return Promise.resolve([]);
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });
    window.sessionStorage.setItem(
      "campushire.admin.students-view.admin-1.institution-1",
      JSON.stringify({ query: "account-a-student" }),
    );
    window.sessionStorage.setItem(
      "campushire.admin.students-view.admin-2.institution-2",
      JSON.stringify({ query: "account-b-student" }),
    );
    render(<AdminStudents />);
    await screen.findByText("No memberships yet");

    currentUser = { id: "admin-2", institution_id: "institution-2" };
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => expect(screen.getByLabelText("Search")).toHaveValue("account-b-student"));
    expect(screen.getByLabelText("Search")).not.toHaveValue("account-a-student");
  });
});
