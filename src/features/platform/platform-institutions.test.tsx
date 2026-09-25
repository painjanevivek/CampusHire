import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlatformInstitutions } from "./platform-workspaces";

const { csrfRequestMock, refreshMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api/client", () => ({
  csrfRequest: csrfRequestMock,
  ApiError: class ApiError extends Error {},
}));
vi.mock("@/features/experience/use-resource", () => ({
  useResource: (path: string | null) => ({
    data: path?.includes("institution-registration-requests")
      ? []
      : path?.startsWith("/platform/institutions?")
        ? { items: [], page: 1, page_size: 50, total: 0 }
        : null,
    loading: false,
    error: null,
    refresh: refreshMock,
  }),
}));

describe("PlatformInstitutions", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset().mockResolvedValue({
      institution_id: "institution-one",
      admin_invitation_id: "invitation-one",
      admin_invitation_token: "single-use-activation-code",
      expires_at: "2026-10-01T10:00:00Z",
    });
    refreshMock.mockReset();
  });

  it("provisions an institution through the authenticated Platform Admin route", async () => {
    render(<PlatformInstitutions />);
    expect(screen.getByRole("heading", { name: "Add Institutes" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add an institute"));
    fireEvent.change(screen.getByLabelText("Institution name"), { target: { value: "Campus One" } });
    fireEvent.change(screen.getByLabelText("Institution code"), { target: { value: "campus-one" } });
    fireEvent.change(screen.getByLabelText("Initial T&P administrator email"), {
      target: { value: "placement@campus-one.edu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create institution" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/platform/institutions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("placement@campus-one.edu"),
      }),
    ));
    expect(await screen.findByText("single-use-activation-code")).toBeInTheDocument();
    expect(screen.getByText(/displayed only once/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Administrator activation code" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done — hide code" }));
    expect(screen.queryByText("single-use-activation-code")).not.toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });
});
