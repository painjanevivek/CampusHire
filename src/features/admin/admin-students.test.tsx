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
      if (path.includes("/memberships?")) return Promise.resolve({ items: [{ id: "membership-1", user_id: "student-1", email: "asha@example.edu", role: "student", status: "active" }], page: 1, page_size: 20, total: 1 });
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
      "https://api.example.test/institutions/institution-1/memberships/export.csv?role=student",
    );

    fireEvent.click(screen.getByText("Change status"));
    const statusSelectors = screen.getAllByRole("combobox");
    fireEvent.change(statusSelectors.at(-1)!, { target: { value: "graduated" } });
    fireEvent.change(screen.getByPlaceholderText("Accountable reason for audit"), { target: { value: "Program completed" } });
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
      if (path.includes("/memberships?")) return Promise.resolve({ items: [], page: 1, page_size: 20, total: 0 });
      if (path.endsWith("/roster-imports")) return Promise.resolve([]);
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
    await screen.findByText("No students match");

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

  it("shows manual activation codes once after a roster commit and lets the officer hide them", async () => {
    csrfRequestMock.mockImplementation((path: string) => {
      if (path.endsWith("/preview")) return Promise.resolve({
        id: "roster-new", status: "previewed", valid_rows: 1, invalid_rows: 0,
        invited_rows: 0, total_rows: 1,
        rows: [{ row_number: 1, email: "asha@example.edu", status: "valid", errors: [] }],
      });
      if (path.endsWith("/commit")) return Promise.resolve({
        id: "roster-new", status: "committed", valid_rows: 1, invalid_rows: 0,
        invited_rows: 1, total_rows: 1,
        rows: [{ row_number: 1, email: "asha@example.edu", status: "invited", errors: [] }],
        handoffs: [{ email: "asha@example.edu", activation_code: "synthetic-one-time-code", expires_at: "2026-09-23T10:00:00Z" }],
      });
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });
    render(<AdminStudents />);
    await screen.findByText("asha@example.edu");
    fireEvent.change(screen.getByLabelText("Preview CSV"), {
      target: { files: [new File(["email\nasha@example.edu"], "students.csv", { type: "text/csv" })] },
    });
    expect(await screen.findByText("Roster preview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Invite valid rows" }));
    expect(await screen.findByText("synthetic-one-time-code")).toBeInTheDocument();
    expect(screen.getByText(/institution-approved secure channel/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done — hide codes" }));
    expect(screen.queryByText("synthetic-one-time-code")).not.toBeInTheDocument();
  });

  it("issues an identity-checked one-time recovery code without showing a student password", async () => {
    csrfRequestMock.mockResolvedValue({ reset_code: "synthetic-recovery-code", expires_in_minutes: 30 });
    render(<AdminStudents />);
    await screen.findByText("asha@example.edu");
    fireEvent.click(screen.getByText("Recover account"));
    fireEvent.change(screen.getByLabelText("Identity check method"), {
      target: { value: "In-person ID check" },
    });
    fireEvent.change(screen.getByLabelText("Verification reference, not an ID number"), {
      target: { value: "synthetic-helpdesk-123" },
    });
    fireEvent.change(screen.getByLabelText("Audit reason"), {
      target: { value: "Student cannot access their account." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Issue one-time code" }));
    expect(await screen.findByText("synthetic-recovery-code")).toBeInTheDocument();
    expect(csrfRequestMock).toHaveBeenCalledWith(
      "/institutions/institution-1/students/student-1/manual-recovery",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("synthetic-helpdesk-123") }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Done — hide code" }));
    expect(screen.queryByText("synthetic-recovery-code")).not.toBeInTheDocument();
  });

  it("rechecks the account namespace before restoring a view", async () => {
    let currentUser = { id: "admin-1", institution_id: "institution-1" };
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/auth/me") return Promise.resolve(currentUser);
      if (path.includes("/memberships?")) return Promise.resolve({ items: [], page: 1, page_size: 20, total: 0 });
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
    await screen.findByText("No students match");

    currentUser = { id: "admin-2", institution_id: "institution-2" };
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => expect(screen.getByLabelText("Search")).toHaveValue("account-b-student"));
    expect(screen.getByLabelText("Search")).not.toHaveValue("account-a-student");
  });
});
