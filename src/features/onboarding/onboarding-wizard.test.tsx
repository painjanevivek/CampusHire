import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "./onboarding-wizard";

const { csrfRequestMock, pushMock } = vi.hoisted(() => ({
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ csrfRequest: csrfRequestMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("OnboardingWizard", () => {
  it("exposes the current profile step in shared navigation semantics", () => {
    render(<OnboardingWizard />);

    expect(screen.getByRole("heading", { name: "Create your profile" })).toBeInTheDocument();

    const progress = screen.getByRole("navigation", { name: "Profile steps" });
    expect(progress).toHaveTextContent("Identity");
    expect(screen.getByText("Step 1 of 6")).toBeInTheDocument();
  });

  it("hands a completed profile directly to opportunities", async () => {
    csrfRequestMock.mockResolvedValue({});
    const onComplete = vi.fn();
    window.addEventListener("campushire:product-event", onComplete);
    render(<OnboardingWizard />);

    const stepTitles = [
      "Education",
      "Skills",
      "Target role",
      "Professional links",
      "Review",
    ];

    for (const title of stepTitles) {
      const submit = screen.getByRole("button", { name: /Save and continue/ });
      fireEvent.submit(submit.closest("form")!);
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: title })).toBeInTheDocument(),
      );
    }

    const finish = screen.getByRole("button", { name: /Finish profile/ });
    fireEvent.submit(finish.closest("form")!);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/opportunities"));
    expect(csrfRequestMock).toHaveBeenCalledTimes(6);
    expect(onComplete).toHaveBeenCalledTimes(1);

    const event = onComplete.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ name: "profile_complete" });
    window.removeEventListener("campushire:product-event", onComplete);
  });

  it("keeps fields in place when a step cannot be saved", async () => {
    csrfRequestMock.mockRejectedValueOnce(new Error("offline"));
    render(<OnboardingWizard />);

    const submit = screen.getByRole("button", { name: /Save and continue/ });
    fireEvent.submit(submit.closest("form")!);

    expect(
      await screen.findByText(
        "We could not save this step. Your fields remain here; try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });
});
