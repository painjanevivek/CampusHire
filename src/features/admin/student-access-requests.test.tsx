import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { StudentAccessRequests } from "./student-access-requests";

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
}));

it("shows only institution-scoped pending identities as unverified", async () => {
  apiRequestMock.mockResolvedValue([{
    id: "request-1",
    email: "student@college.edu",
    created_at: "2026-09-22T10:00:00Z",
  }]);

  render(<StudentAccessRequests institutionId="institution-1" />);
  const disclosure = screen.getByText("Student access requests").closest("details")!;
  disclosure.open = true;
  fireEvent(disclosure, new Event("toggle", { bubbles: true }));

  await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith(
    "/institutions/institution-1/student-access-requests",
    { cache: "no-store" },
  ));
  expect(await screen.findByText("student@college.edu")).toBeInTheDocument();
  expect(screen.getByText("Unverified")).toBeInTheDocument();
  expect(screen.getByText(/verify each student through an approved channel/i)).toBeInTheDocument();
});
