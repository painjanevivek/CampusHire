import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentOnboardingWizard, onboardingStageForBackendStep } from "./student-onboarding-wizard";

const { apiRequestMock, csrfRequestMock, routerReplaceMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
  routerReplaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: routerReplaceMock }) }));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const onboarding = {
  profile_id: "profile-1",
  institution_id: "institution-1",
  institution_name: "Campus University",
  revision: 0,
  current_step: 1,
  completed: false,
  completed_at: null,
  identity: {},
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  skills: [],
  career_preferences: null,
  placement_participation: null,
};

describe("student onboarding stages", () => {
  it.each([[1, 1], [2, 1], [3, 2], [4, 3], [5, 4], [6, 5], [7, 5]])(
    "maps backend step %i into guided stage %i",
    (backendStep, expectedStage) => {
      expect(onboardingStageForBackendStep(backendStep)).toBe(expectedStage);
    },
  );

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    apiRequestMock.mockResolvedValue(onboarding);
    csrfRequestMock.mockImplementation(async (_path: string, options: RequestInit) => {
      const request = JSON.parse(String(options.body)) as { step: number; expected_revision: number };
      return {
        ...onboarding,
        revision: request.expected_revision + 1,
        current_step: request.step + 1,
        completed: request.step === 7,
      };
    });
  });

  it("presents five onboarding stages in a horizontal progress bar without the old sidebar copy", async () => {
    render(<StudentOnboardingWizard />);

    expect(await screen.findByRole("heading", { name: "Your profile" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Onboarding progress" })).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("list", { name: "Student onboarding steps" }).children).toHaveLength(5);
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.queryByText(/Complete these steps to open your workspace/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /finish later/i })).not.toBeInTheDocument();
    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith("/onboarding", { cache: "no-store" }));
  });

  it("positions the progress bar at the stage returned by the onboarding service", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 4 });

    render(<StudentOnboardingWizard />);

    expect(await screen.findByRole("heading", { name: "Projects & skills" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Onboarding progress" })).toHaveAttribute("aria-valuenow", "3");
    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
  });

  it("keeps identity and education together while preserving the two-step API contract", async () => {
    render(<StudentOnboardingWizard />);
    await screen.findByRole("heading", { name: "Your profile" });

    const values: Record<string, string> = {
      "Full name": "Aarav Student",
      "PRN / enrollment ID": "PRN-12345",
      Department: "Computer Science",
      "Graduation year": "2027",
      Degree: "Bachelor of Engineering",
      Branch: "Computer Science",
      "Awarding institution": "Campus University",
      "CGPA / percentage": "8.5",
    };
    for (const [label, value] of Object.entries(values)) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    expect(await screen.findByRole("heading", { name: "Experience" })).toBeInTheDocument();
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(csrfRequestMock.mock.calls[0][1].body))).toMatchObject({ step: 1, identity: { full_name: "Aarav Student" } });
    expect(JSON.parse(String(csrfRequestMock.mock.calls[1][1].body))).toMatchObject({ step: 2, education: [{ degree: "Bachelor of Engineering" }] });
  });

  it("sends already-completed students straight to their workspace", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, completed: true });

    render(<StudentOnboardingWizard />);

    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByRole("heading", { name: "Your profile" })).not.toBeInTheDocument();
  });

  it("requires final confirmation and completes the last backend step before entering the app", async () => {
    apiRequestMock.mockResolvedValue({
      ...onboarding,
      revision: 8,
      current_step: 7,
      identity: { full_name: "Aarav Student", prn: "PRN-12345", department: "Computer Science", graduation_year: 2027 },
      education: [{ degree: "Bachelor of Engineering", branch: "Computer Science", institution: "Campus University", score: 8.5, score_scale: "cgpa_10", active_backlogs: 0 }],
      career_preferences: { target_roles: ["Software Engineer"] },
      placement_participation: { placement_cycle: "2026–27", communication_channels: ["email"], privacy_accepted: true },
    });

    render(<StudentOnboardingWizard />);
    await screen.findByRole("heading", { name: "Placement details" });
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed this information and confirm it is accurate/i }));
    fireEvent.click(screen.getByRole("button", { name: "Complete onboarding" }));

    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/dashboard"));
    expect(csrfRequestMock.mock.calls.map((call) => JSON.parse(String(call[1].body)).step)).toEqual([6, 7]);
  });
});
