import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<object>(),
  apiRequest: apiRequestMock,
}));

import { ApiError } from "@/lib/api/client";
import { MfaStatusControl } from "./mfa-status-control";

describe("MfaStatusControl", () => {
  beforeEach(() => apiRequestMock.mockReset());

  it("shows the request error and recovers when the status check is retried", async () => {
    apiRequestMock
      .mockRejectedValueOnce(new ApiError(503, "Authenticator service is temporarily unavailable."))
      .mockResolvedValueOnce({ enabled: false });

    render(<MfaStatusControl workspace="student" />);

    expect(await screen.findByText("Authenticator service is temporarily unavailable.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry status check" }));

    expect(await screen.findByRole("link", { name: "Set up MFA" })).toHaveAttribute(
      "href",
      "/student/mfa/setup?next=/profile",
    );
    expect(apiRequestMock).toHaveBeenCalledTimes(2);
  });
});
