import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InstitutionSwitcher } from "./institution-switcher";

const { apiRequestMock, csrfRequestMock, replaceMock, refreshMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
  ApiError: class ApiError extends Error {},
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

describe("InstitutionSwitcher", () => {
  beforeEach(() => {
    apiRequestMock.mockReset().mockResolvedValue([
      { id: "assignment-one", institution_id: "institution-one", institution_name: "Campus One", role: "tnp_admin" },
      { id: "assignment-two", institution_id: "institution-two", institution_name: "Campus Two", role: "tnp_admin" },
    ]);
    csrfRequestMock.mockReset().mockResolvedValue({ institution_id: "institution-two" });
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("shows assigned institutions and switches the server-side context", async () => {
    render(<InstitutionSwitcher institutionId="institution-one" />);
    const select = await screen.findByRole("combobox", { name: "Current institution" });
    expect(select).toHaveValue("assignment-one");
    fireEvent.change(select, { target: { value: "assignment-two" } });
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/auth/active-membership",
      { method: "POST", body: JSON.stringify({ membership_id: "assignment-two" }) },
    ));
    expect(replaceMock).toHaveBeenCalledWith("/tnp/dashboard");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("keeps the old context and reports a failed switch", async () => {
    csrfRequestMock.mockRejectedValue(new Error("request failed"));
    render(<InstitutionSwitcher institutionId="institution-one" />);
    fireEvent.change(await screen.findByRole("combobox", { name: "Current institution" }), {
      target: { value: "assignment-two" },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Institution could not be changed.");
    expect(screen.getByRole("combobox", { name: "Current institution" })).toHaveValue("assignment-one");
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
