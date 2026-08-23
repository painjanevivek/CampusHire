import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationCenter } from "./notification-center";

const { apiRequestMock, csrfRequestMock, pushMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const notification = {
  id: "notice-1",
  event_key: "application:1:shortlisted",
  title: "Application shortlisted",
  body: "Review the placement update.",
  deep_link: "/opportunities/role-1",
  read_at: null,
  created_at: "2026-08-24T00:00:00Z",
};

describe("NotificationCenter", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    pushMock.mockReset();
    apiRequestMock.mockResolvedValue({
      items: [notification],
      unread_count: 1,
    });
    csrfRequestMock.mockResolvedValue({
      ...notification,
      read_at: "2026-08-24T01:00:00Z",
    });
  });

  it("marks an update read before following its safe internal destination", async () => {
    render(<NotificationCenter navigate={pushMock} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Open updates, 1 unread" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Application shortlisted/ }),
    );
    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/notifications/notice-1/read",
        { method: "POST" },
      ),
    );
    expect(pushMock).toHaveBeenCalledWith("/opportunities/role-1");
  });
});
