import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileWorkspace } from "./profile-workspace";

const { apiRequestMock, csrfRequestMock, refreshMock, replaceMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  refreshMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  apiRequest: apiRequestMock,
  cachedApiRequest: apiRequestMock,
  clearApiQueryCache: vi.fn(),
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));
vi.mock("./communication-preferences", () => ({
  CommunicationPreferences: () => <div>Email preference controls</div>,
}));

describe("ProfileWorkspace session controls", () => {
  beforeEach(() => {
    apiRequestMock.mockReset().mockImplementation((path: string) => {
      if (path === "/profile") {
        return Promise.resolve({
          full_name: "Asha Rao",
          department: "Computer Science",
          education: [],
          skills: [],
          target_roles: [],
          github_url: null,
          portfolio_url: null,
          readiness: 60,
          checklist: [
            { key: "identity", label: "Institution identity", complete: true, required: true },
            { key: "education", label: "Education", complete: false, required: true },
            { key: "skills", label: "Skills", complete: false, required: false },
          ],
        });
      }
      return Promise.resolve([{
        id: "session-1",
        created_at: "2026-08-28T08:00:00Z",
        last_activity_at: "2026-08-28T09:00:00Z",
        expires_at: "2026-08-29T08:00:00Z",
        device_summary: "Chrome on Windows",
        current: true,
      }]);
    });
    csrfRequestMock.mockReset().mockResolvedValue(undefined);
    refreshMock.mockReset();
    replaceMock.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("keeps account settings collapsed and loads session details only when requested", async () => {
    render(<ProfileWorkspace />);

    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
    expect(screen.queryByText("Chrome on Windows")).not.toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalledWith("/auth/sessions", expect.anything());

    fireEvent.click(screen.getByRole("button", { name: /Active sessions/ }));

    expect(await screen.findByText(/Chrome on Windows/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Active sessions/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("revokes every session before clearing state and returning to sign in", async () => {
    window.sessionStorage.setItem("campushire.private", "sensitive");
    render(<ProfileWorkspace />);

    fireEvent.click(await screen.findByRole("button", { name: /Active sessions/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Sign out all devices" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/auth/sign-out-all",
      { method: "POST" },
    ));
    expect(window.sessionStorage.getItem("campushire.private")).toBeNull();
    expect(replaceMock).toHaveBeenCalledWith("/sign-in");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("keeps security controls available when the profile summary fails to load", async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/profile") return Promise.reject(new Error("profile unavailable"));
      return Promise.resolve([{
        id: "session-1",
        created_at: "2026-08-28T08:00:00Z",
        last_activity_at: "2026-08-28T09:00:00Z",
        expires_at: "2026-08-29T08:00:00Z",
        device_summary: "Chrome on Windows",
        current: true,
      }]);
    });

    render(<ProfileWorkspace />);

    expect(await screen.findByText(/profile summary could not be refreshed/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Active sessions/ }));
    expect(await screen.findByText(/Chrome on Windows/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out all devices" })).toBeInTheDocument();
  });

  it("distinguishes an empty session response from loading and retains sign-out-all", async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/profile") {
        return Promise.resolve({
          full_name: "Asha Rao",
          department: "Computer Science",
          education: [],
          skills: [],
          target_roles: [],
          github_url: null,
          portfolio_url: null,
          readiness: 60,
          checklist: [
            { key: "identity", label: "Institution identity", complete: true, required: true },
            { key: "education", label: "Education", complete: false, required: true },
          ],
        });
      }
      return Promise.resolve([]);
    });

    render(<ProfileWorkspace />);

    fireEvent.click(await screen.findByRole("button", { name: /Active sessions/ }));
    expect(await screen.findByText("No active session details were returned.")).toBeInTheDocument();
    expect(screen.queryByText("Session details are loading.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out all devices" })).toBeInTheDocument();
  });

  it("reveals optional email controls only when the student opens them", async () => {
    render(<ProfileWorkspace />);

    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
    expect(screen.queryByText("Email preference controls")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Email notifications/ }));

    expect(screen.getByText("Email preference controls")).toBeInTheDocument();
  });
});
