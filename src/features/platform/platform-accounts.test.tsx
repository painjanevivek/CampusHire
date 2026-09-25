import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlatformAccounts } from "./platform-workspaces";

const { csrfRequestMock, refreshMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("institution=institution-one"),
}));
vi.mock("@/lib/api/client", () => ({
  csrfRequest: csrfRequestMock,
  ApiError: class ApiError extends Error {},
}));
vi.mock("@/features/experience/use-resource", () => ({
  useResource: (path: string) => ({
    data: path.includes("staff-accounts") ? [{
      id: "assignment-one", institution_id: "institution-one", user_id: "officer-one",
      username: "placement.officer", email: "placement.officer@example.invalid",
      role: "tnp_admin", status: "active", requires_terms_acceptance: false,
    }] : { items: [{ id: "institution-one", name: "Campus One" }] },
    loading: false,
    error: null,
    refresh: refreshMock,
  }),
}));

describe("PlatformAccounts", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset().mockResolvedValue({});
    refreshMock.mockReset();
  });

  it("assigns an existing T&P username to the selected institution", async () => {
    csrfRequestMock.mockResolvedValueOnce({
      id: "assignment-two", institution_id: "institution-one", user_id: "officer-two",
      username: "placement.officer.two", email: "placement.officer.two@example.invalid",
      role: "tnp_reviewer", status: "active", requires_terms_acceptance: false,
    });
    render(<PlatformAccounts />);
    const assignmentPanel = screen.getByText("Assign existing account", { selector: "summary" }).closest("details")!;
    fireEvent.click(assignmentPanel.querySelector("summary")!);
    fireEvent.change(screen.getByLabelText("Existing username"), {
      target: { value: "placement.officer.two" },
    });
    fireEvent.change(screen.getByLabelText("Role at this institution"), {
      target: { value: "tnp_reviewer" },
    });
    fireEvent.change(within(assignmentPanel).getByLabelText(/Audit reason/), {
      target: { value: "Officer covering assigned reviews here." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign existing account" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/platform/institutions/institution-one/staff-assignments",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("placement.officer.two") }),
    ));
    expect(await within(screen.getByRole("region", { name: "T&P account directory" })).findByText("placement.officer.two")).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows a newly created T&P account in the directory as soon as creation succeeds", async () => {
    csrfRequestMock.mockResolvedValueOnce({
      id: "assignment-two", institution_id: "institution-one", user_id: "officer-two",
      username: "new.officer", email: "new.officer@example.invalid",
      role: "tnp_reviewer", status: "active", requires_terms_acceptance: true,
    });
    render(<PlatformAccounts />);
    const creationPanel = screen.getByRole("region", { name: "Create T&P Account" });
    fireEvent.change(within(creationPanel).getByLabelText("Username"), { target: { value: "new.officer" } });
    fireEvent.change(within(creationPanel).getByLabelText("Temporary password"), { target: { value: "SecureInitial12" } });
    fireEvent.change(within(creationPanel).getByLabelText("Confirm password"), { target: { value: "SecureInitial12" } });
    fireEvent.change(within(creationPanel).getByLabelText(/Audit reason/), { target: { value: "New officer for account review." } });
    fireEvent.click(within(creationPanel).getByRole("button", { name: "Create account" }));

    expect(await within(screen.getByRole("region", { name: "T&P account directory" })).findByText("new.officer")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Temporary password for new.officer" })).toBeInTheDocument();
    expect(screen.getByText("SecureInitial12")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done — hide password" }));
    expect(screen.queryByText("SecureInitial12")).not.toBeInTheDocument();
    expect(csrfRequestMock).toHaveBeenCalledWith(
      "/platform/institutions/institution-one/staff-accounts",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("new.officer") }),
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("generates a masked temporary password and confirms it in the form", () => {
    render(<PlatformAccounts />);
    const creationPanel = screen.getByRole("region", { name: "Create T&P Account" });
    fireEvent.click(within(creationPanel).getByRole("button", { name: "Generate" }));
    const password = within(creationPanel).getByLabelText("Temporary password") as HTMLInputElement;
    const confirmation = within(creationPanel).getByLabelText("Confirm password") as HTMLInputElement;
    expect(password.type).toBe("password");
    expect(password.value).toHaveLength(20);
    expect(confirmation.value).toBe(password.value);
  });

  it("requires an identity-check record before displaying a staff recovery code", async () => {
    csrfRequestMock.mockResolvedValue({ reset_code: "synthetic-staff-recovery-code", expires_in_minutes: 30 });
    render(<PlatformAccounts />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Issue manual recovery code" }));
    fireEvent.change(screen.getByLabelText("Identity check method"), {
      target: { value: "Verified helpdesk callback" },
    });
    fireEvent.change(screen.getByLabelText("Verification reference"), {
      target: { value: "synthetic-ticket-123" },
    });
    fireEvent.change(screen.getByLabelText("Recovery audit reason"), {
      target: { value: "Officer has lost account access." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Issue one-time code" }));
    expect(await screen.findByText("synthetic-staff-recovery-code")).toBeInTheDocument();
    expect(csrfRequestMock).toHaveBeenCalledWith(
      "/platform/staff-accounts/officer-one/manual-recovery",
      expect.objectContaining({ method: "POST", body: expect.stringContaining("synthetic-ticket-123") }),
    );
  });
});
