import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminAccountWorkspace } from "./admin-account-workspace";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));

vi.mock("@/lib/api/client", () => ({
  apiRequest: apiRequestMock,
  csrfRequest: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("./communication-preferences", () => ({
  CommunicationPreferences: () => <div>Administrator email preference controls</div>,
}));

describe("AdminAccountWorkspace", () => {
  it("shows assigned identity while progressively disclosing account controls", () => {
    render(<AdminAccountWorkspace user={{
      id: "admin-1",
      email: "placement@college.edu",
      role: "tnp_admin",
      institution_id: "institution-1",
      membership_status: "active",
    }} />);

    expect(screen.getAllByText("placement@college.edu")).toHaveLength(2);
    expect(screen.getAllByText("T&P administrator")).toHaveLength(2);
    expect(screen.queryByText("Administrator email preference controls")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Email notifications/ }));

    expect(screen.getByText("Administrator email preference controls")).toBeInTheDocument();
  });
});
