import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OutcomeTimeline } from "./outcome-timeline";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

describe("OutcomeTimeline", () => {
  beforeEach(() => {
    apiRequestMock.mockReset().mockResolvedValue([
      {
        id: "offer-1",
        event_type: "offer_issued",
        outcome_state: "verified",
        event_at: "2026-09-20T10:00:00Z",
        source_type: "offer_letter",
        evidence_reference: "private://offer",
        verified_at: "2026-09-20T10:05:00Z",
        joining_date: null,
        joining_location: null,
        next_update_owner: "Placement officer",
        next_update_due_at: "2026-09-25T10:00:00Z",
        supersedes_event_id: null,
        superseded_by_event_id: null,
        correction_reason: null,
      },
    ]);
    csrfRequestMock.mockReset().mockResolvedValue({ id: "event-2" });
  });

  it("keeps an offer distinct from joining", async () => {
    render(<OutcomeTimeline applicationId="application-1" endpoint="/applications/application-1/outcomes" timeZone="UTC" />);
    expect(await screen.findByText("Offer issued")).toBeInTheDocument();
    expect(screen.getByText(/offer is never treated as proof of joining/i)).toBeInTheDocument();
    expect(screen.queryByText("Joined")).not.toBeInTheDocument();
    expect(screen.getByText("Evidence on file", { exact: false })).toBeInTheDocument();
  });

  it("lets an officer record a separate verified joining event", async () => {
    render(<OutcomeTimeline applicationId="application-1" endpoint="/tnp/recruitment/applications/application-1/outcomes" timeZone="UTC" canRecord />);
    await screen.findByText("Offer issued");
    fireEvent.click(screen.getByText("Record placement outcome"));
    fireEvent.change(screen.getByLabelText("Outcome"), { target: { value: "joining" } });
    fireEvent.change(screen.getByLabelText("Evidence state"), { target: { value: "verified" } });
    fireEvent.change(screen.getByLabelText("Event time"), { target: { value: "2026-09-23T10:00" } });
    fireEvent.change(screen.getByLabelText("Source type"), { target: { value: "employer_confirmation" } });
    fireEvent.change(screen.getByLabelText("Evidence reference"), { target: { value: "private://joining-confirmation" } });
    fireEvent.click(screen.getByRole("button", { name: "Record append-only event" }));
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/tnp/recruitment/applications/application-1/outcomes",
      expect.objectContaining({ method: "POST" }),
    ));
    expect(await screen.findByText(/Existing evidence was not rewritten/i)).toBeInTheDocument();
  });
});
