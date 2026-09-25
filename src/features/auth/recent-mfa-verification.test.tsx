import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecentMfaVerification } from "./recent-mfa-verification";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

describe("RecentMfaVerification", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
  });

  it("re-authenticates the same non-MFA admin in place", async () => {
    const onVerified = vi.fn();
    apiRequestMock.mockResolvedValueOnce({ enabled: false }).mockResolvedValueOnce({
      id: "admin-one", username: "platform.admin", email: "platform.admin@example.invalid",
    });
    csrfRequestMock.mockResolvedValueOnce({
      user: { id: "admin-one" }, next_step: "complete",
    });

    render(<RecentMfaVerification onVerified={onVerified} />);
    expect(screen.getByRole("heading", { name: "Re-authentication required" })).toBeInTheDocument();
    const password = await screen.findByLabelText("Your account password");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.change(password, { target: { value: "current-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in again" }));

    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
    expect(csrfRequestMock).toHaveBeenCalledWith("/auth/sign-in", expect.objectContaining({
      method: "POST", body: JSON.stringify({
        identifier: "platform.admin", password: "current-secret", workspace: "admin",
      }),
    }));
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });
});
