import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "./onboarding-wizard";
import { ApiError } from "@/lib/api/client";

const { apiRequestMock, csrfRequestMock, pushMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("OnboardingWizard", () => {
  const profile = {
    full_name: null,
    institution_name: null,
    prn: null,
    department: null,
    academic_year: null,
    phone: null,
    education: [],
    skills: [],
    target_roles: [],
    external_links: {},
    onboarding_step: 1,
    revision: 1,
    readiness: 0,
    is_complete: false,
  };

  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    pushMock.mockReset();
    apiRequestMock.mockResolvedValue(profile);
    let revision = 1;
    csrfRequestMock.mockImplementation(async () => ({ ...profile, revision: ++revision }));
  });

  it("exposes the current profile step in shared navigation semantics", () => {
    render(<OnboardingWizard />);

    expect(screen.getByRole("heading", { name: "Create your profile" })).toBeInTheDocument();

    const progress = screen.getByRole("navigation", { name: "Profile steps" });
    expect(progress).toHaveTextContent("Identity");
    expect(
      screen.getByRole("list", { name: "Profile setup progress" }),
    ).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Step 1 of 6")).toBeInTheDocument();
  });

  it("hands a completed profile directly to opportunities", async () => {
    const onComplete = vi.fn();
    window.addEventListener("campushire:product-event", onComplete);
    render(<OnboardingWizard />);

    await screen.findByLabelText("Full name");

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

    await screen.findByLabelText("Full name");

    const submit = screen.getByRole("button", { name: /Save and continue/ });
    fireEvent.submit(submit.closest("form")!);

    expect(
      await screen.findByText(
        "We could not save this step. Your fields remain here; try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("surfaces revision conflicts without discarding the current fields", async () => {
    csrfRequestMock.mockRejectedValueOnce(new ApiError(409, "The profile changed in another session.", "profile_revision_conflict"));
    render(<OnboardingWizard />);

    const name = await screen.findByLabelText("Full name");
    fireEvent.change(name, { target: { value: "Asha Patil" } });
    fireEvent.submit(screen.getByRole("button", { name: /Save and continue/ }).closest("form")!);

    expect(await screen.findByText(/changed in another session/)).toBeInTheDocument();
    expect(name).toHaveValue("Asha Patil");
    expect(screen.getByRole("button", { name: "Reload saved profile" })).toBeInTheDocument();
  });
});
