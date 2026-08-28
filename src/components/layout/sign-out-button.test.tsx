import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignOutButton } from "./sign-out-button";

const { csrfRequestMock, refreshMock, replaceMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  refreshMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ csrfRequest: csrfRequestMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset();
    refreshMock.mockReset();
    replaceMock.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => vi.restoreAllMocks());

  it("revokes the current session, clears CampusHire state, and redirects", async () => {
    csrfRequestMock.mockResolvedValue(undefined);
    window.localStorage.setItem("campushire.preference", "private");
    window.localStorage.setItem("unrelated.preference", "keep");
    window.sessionStorage.setItem("campushire.admin.audit-view", "private");

    render(<SignOutButton destination="/sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/auth/sign-out",
      { method: "POST" },
    ));
    expect(window.localStorage.getItem("campushire.preference")).toBeNull();
    expect(window.sessionStorage.getItem("campushire.admin.audit-view")).toBeNull();
    expect(window.localStorage.getItem("unrelated.preference")).toBe("keep");
    expect(replaceMock).toHaveBeenCalledWith("/sign-in");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("keeps browser state and reports failure when revocation fails", async () => {
    csrfRequestMock.mockRejectedValue(new Error("offline"));
    window.sessionStorage.setItem("campushire.private", "keep-until-revoked");

    render(<SignOutButton destination="/admin/sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sign out failed. Your session is still active.",
    );
    expect(window.sessionStorage.getItem("campushire.private")).toBe("keep-until-revoked");
    expect(replaceMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("still redirects after revocation when hardened browser storage is unavailable", async () => {
    csrfRequestMock.mockResolvedValue(undefined);
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Storage is disabled", "SecurityError");
    });

    render(<SignOutButton destination="/sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/sign-in"));
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
