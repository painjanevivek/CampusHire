import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PrivacyControls } from "./privacy-controls";

const { csrfRequestMock } = vi.hoisted(() => ({ csrfRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  csrfRequest: csrfRequestMock,
}));

describe("PrivacyControls", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset();
    csrfRequestMock.mockResolvedValue({
      id: "12345678-1111-1111-1111-111111111111",
      status: "pending",
      requested_at: "2026-08-24T00:00:00Z",
      message: "Account records were removed; private-object cleanup is queued.",
    });
  });

  it("requires the exact irreversible confirmation before requesting deletion", async () => {
    render(<PrivacyControls />);
    const button = screen.getByRole("button", { name: "Delete eligible data" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Type DELETE MY CAMPUSHIRE DATA/), {
      target: { value: "DELETE MY CAMPUSHIRE DATA" },
    });
    fireEvent.click(button);

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/privacy/deletion-requests",
      {
        method: "POST",
        body: JSON.stringify({
          confirmation: "DELETE MY CAMPUSHIRE DATA",
          scope: "account_all_memberships",
        }),
      },
    ));
    expect(await screen.findByRole("status")).toHaveTextContent("Reference 12345678");
  });
});
