import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MfaForm } from "./mfa-form";
import { ApiError } from "@/lib/api/client";

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
  afterEach(() => vi.useRealTimers());

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

  it("shows only the authenticator-code challenge after enrollment", async () => {
    csrfRequestMock.mockResolvedValueOnce(undefined);
    render(<MfaForm mode="challenge" />);

    expect(screen.getByRole("textbox", { name: "Verification code" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Scan the QR code" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /QR code for adding this CampusHire/ })).not.toBeInTheDocument();
    expect(qrCodeMock).not.toHaveBeenCalled();
    expect(csrfRequestMock).not.toHaveBeenCalledWith("/auth/mfa/setup", { method: "POST" });

    fireEvent.change(screen.getByRole("textbox", { name: "Verification code" }), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/auth/mfa/challenge",
      { method: "POST", body: JSON.stringify({ code: "123456" }) },
    ));
  });

  it("verifies the enrolled factor before replacing an authenticator", async () => {
    csrfRequestMock
      .mockRejectedValueOnce(new ApiError(403, "Verify the enrolled factor before replacing it.", "mfa_reauthentication_required"))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        secret: "JBSWY3DPEHPK3PXP",
        provisioning_uri: "otpauth://totp/CampusHire:admin@example.edu?secret=JBSWY3DPEHPK3PXP",
      });

    render(<MfaForm mode="setup" />);
    fireEvent.change(await screen.findByRole("textbox", { name: "Current authenticator or recovery code" }), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify current factor" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/auth/mfa/challenge",
      { method: "POST", body: JSON.stringify({ code: "123456" }) },
    ));
    expect(await screen.findByRole("heading", { name: "Scan the QR code" })).toBeInTheDocument();
    expect(csrfRequestMock).toHaveBeenLastCalledWith("/auth/mfa/setup", { method: "POST" });
  });

  it("rotates the setup secret after 30 seconds idle and reveals a new QR on request", async () => {
    vi.useFakeTimers();
    qrCodeMock
      .mockResolvedValueOnce("data:image/png;base64,old-qr")
      .mockResolvedValueOnce("data:image/png;base64,new-qr");
    csrfRequestMock
      .mockResolvedValueOnce({
        secret: "JBSWY3DPEHPK3PXP",
        provisioning_uri: "otpauth://totp/CampusHire:admin@example.edu?secret=JBSWY3DPEHPK3PXP",
      })
      .mockResolvedValueOnce({
        secret: "NB2W45DFOIZA====",
        provisioning_uri: "otpauth://totp/CampusHire:admin@example.edu?secret=NB2W45DFOIZA====",
      });

    render(<MfaForm mode="setup" />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("img", { name: /QR code for adding this CampusHire/ })).toHaveAttribute("src", "data:image/png;base64,old-qr");

    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    fireEvent.keyDown(window, { key: "Tab" });
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    expect(csrfRequestMock).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(csrfRequestMock).toHaveBeenLastCalledWith("/auth/mfa/setup/refresh", { method: "POST" });
    expect(screen.queryByRole("img", { name: /QR code for adding this CampusHire/ })).not.toBeInTheDocument();
    expect(screen.queryByText("JBSWY3DPEHPK3PXP")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show new QR code" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify code" })).toBeDisabled();
    expect(qrCodeMock).toHaveBeenLastCalledWith(expect.stringContaining("secret=NB2W45DFOIZA===="), expect.any(Object));

    fireEvent.click(screen.getByRole("button", { name: "Show new QR code" }));
    expect(screen.getByRole("img", { name: /QR code for adding this CampusHire/ })).toHaveAttribute("src", "data:image/png;base64,new-qr");
    expect(screen.getByRole("button", { name: "Verify code" })).toBeEnabled();
  });
});
