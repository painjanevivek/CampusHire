import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MfaForm } from "./mfa-form";

const { csrfRequestMock, qrCodeMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  qrCodeMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  csrfRequest: csrfRequestMock,
}));
vi.mock("qrcode", () => ({ default: { toDataURL: qrCodeMock } }));

describe("MfaForm", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset().mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      provisioning_uri: "otpauth://totp/CampusHire:admin@example.edu?secret=JBSWY3DPEHPK3PXP",
    });
    qrCodeMock.mockReset().mockResolvedValue("data:image/png;base64,qr-code");
  });

  it("offers a scannable QR code with a manual setup fallback", async () => {
    render(<MfaForm mode="setup" />);

    expect(screen.getByRole("heading", { name: "Scan the QR code" })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /QR code for adding this CampusHire/ })).toHaveAttribute("src", "data:image/png;base64,qr-code");
    expect(screen.getByText("Use a manual setup key instead")).toBeInTheDocument();
    await waitFor(() => expect(qrCodeMock).toHaveBeenCalledWith(expect.stringContaining("otpauth://totp/CampusHire"), expect.any(Object)));
  });
});
