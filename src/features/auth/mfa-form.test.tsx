import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MfaForm } from "./mfa-form";

const { csrfRequestMock, pushMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

describe("MfaForm", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset();
    pushMock.mockReset();
  });

  it("continues a newly verified owner to institution onboarding", async () => {
    csrfRequestMock
      .mockResolvedValueOnce({ secret: "TESTSECRET", provisioning_uri: "otpauth://test" })
      .mockResolvedValueOnce({ recovery_codes: ["recovery-code"] });

    render(<MfaForm mode="setup" nextPath="/admin/onboarding" />);
    expect(await screen.findByText("TESTSECRET")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    expect(await screen.findByText("recovery-code")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue to administration" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin/onboarding"));
  });
});
