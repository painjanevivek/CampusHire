import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CorrectionPanel } from "./correction-panel";
import { ApiError } from "@/lib/api/client";

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/api/client", async original => ({ ...await original<typeof import("@/lib/api/client")>(), apiRequest: mocks.get, csrfRequest: mocks.post }));
const request = { id: "request-1", instructions: "Please explain your project contribution.", deadline_at: "2020-01-01T00:00:00Z", overdue: true, status: "open", revision: 4, events: [{ id: "event-1", action: "created", body: "Project evidence required", created_at: "2020-01-01T00:00:00Z", resume_version_id: null }] };
describe("CorrectionPanel", () => {
  beforeEach(() => { mocks.get.mockReset().mockImplementation((path: string) => Promise.resolve(path === "/resumes" ? [] : [request])); mocks.post.mockReset(); });
  it("allows a late response and submits the exact observed revision", async () => {
    const refresh = vi.fn(); render(<CorrectionPanel applicationId="app-1" onChange={refresh} />);
    await screen.findByText(request.instructions);
    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your response"), { target: { value: "I implemented and tested the API integration." } });
    mocks.post.mockResolvedValue({});
    fireEvent.click(screen.getByRole("button", { name: "Send response for review" }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith("/applications/app-1/requests/request-1/response", expect.objectContaining({ body: expect.stringContaining('"expected_revision":4') })));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
  it("preserves the response text on a stale-write conflict", async () => {
    render(<CorrectionPanel applicationId="app-1" />); await screen.findByText(request.instructions);
    fireEvent.change(screen.getByLabelText("Your response"), { target: { value: "My response remains available after a conflict." } });
    mocks.post.mockRejectedValue(new ApiError(409, "revision_conflict"));
    fireEvent.click(screen.getByRole("button", { name: "Send response for review" }));
    expect(await screen.findByText(/This request changed/)).toBeInTheDocument();
    expect(screen.getByLabelText("Your response")).toHaveValue("My response remains available after a conflict.");
  });
  it("shows pending responses to officers without automatically resolving them", async () => {
    mocks.get.mockResolvedValue([{ ...request, status: "awaiting_review" }]);
    render(<CorrectionPanel applicationId="app-1" admin />); await screen.findByText(request.instructions);
    expect(screen.getByRole("option", { name: "Resolve request" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Request another response" })).toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
