import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { csrfRequestMock } = vi.hoisted(() => ({ csrfRequestMock: vi.fn() }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  csrfRequest: csrfRequestMock,
}));

import { PlatformNotices } from "./platform-notices";

describe("PlatformNotices", () => {
  beforeEach(() => {
    csrfRequestMock.mockReset().mockResolvedValue({
      notice_id: "notice-1",
      tnp_recipients: 4,
      student_recipients: 0,
    });
  });

  it("sends only to the checked audience and reports the delivery count", async () => {
    render(<PlatformNotices />);
    fireEvent.change(screen.getByRole("textbox", { name: "Subject" }), { target: { value: "Placement office update" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Notice" }), { target: { value: "Please review the new schedule." } });
    fireEvent.click(screen.getByRole("checkbox", { name: "T&P officers" }));
    fireEvent.click(screen.getByRole("button", { name: "Send notice" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith("/platform/notices", {
      method: "POST",
      body: JSON.stringify({
        subject: "Placement office update",
        message: "Please review the new schedule.",
        to_tnp: true,
        to_students: false,
      }),
    }));
    expect(await screen.findByText(/Notice sent to 4 T&P accounts and 0 students/)).toBeInTheDocument();
  });
});
