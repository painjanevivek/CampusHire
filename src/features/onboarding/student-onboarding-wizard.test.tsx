import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentOnboardingWizard, onboardingStageForBackendStep } from "./student-onboarding-wizard";

const { apiRequestMock, csrfRequestMock, routerReplaceMock, routerMock } = vi.hoisted(() => {
  const routerReplaceMock = vi.fn();
  return {
    apiRequestMock: vi.fn(),
    csrfRequestMock: vi.fn(),
    routerReplaceMock,
    routerMock: { replace: routerReplaceMock },
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
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

  it("presents five onboarding stages without unnecessary sidebar guidance", async () => {
    render(<StudentOnboardingWizard />);

    expect(await screen.findByRole("heading", { name: "Your profile" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Onboarding progress" })).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByRole("list", { name: "Student onboarding steps" }).children).toHaveLength(5);
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.queryByText(/Complete these steps to open your workspace/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /finish later/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Five guided steps help your placement team understand your background/)).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("onboarding-scrollbar-hidden");
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();
    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith("/onboarding", { cache: "no-store" }));
  });

  it("positions the progress bar at the stage returned by the onboarding service", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 4 });

    render(<StudentOnboardingWizard />);

    expect(await screen.findByRole("heading", { name: "Project Experience" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Onboarding progress" })).toHaveAttribute("aria-valuenow", "3");
    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
  });

  it("lets students say they have no internships and continue with an empty list", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 3 });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Experience" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    expect(await screen.findByRole("heading", { name: "Project Experience" })).toBeInTheDocument();
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(csrfRequestMock.mock.calls[0][1].body))).toMatchObject({
      step: 3,
      experience: [],
    });
  });

  it("collects and saves multiple internships after a yes answer", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 3 });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Experience" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.change(screen.getByLabelText("Internship organization"), { target: { value: "Northstar Labs" } });
    fireEvent.change(screen.getByLabelText("Role / internship title"), { target: { value: "Software Intern" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2025-05-01" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2025-07-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Internship" }));

    expect(screen.getByText("Northstar Labs")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Another Internship" }));
    fireEvent.change(screen.getByLabelText("Internship organization"), { target: { value: "Juniper Tech" } });
    fireEvent.change(screen.getByLabelText("Role / internship title"), { target: { value: "Backend Intern" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2024-06-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Internship" }));
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    expect(await screen.findByRole("heading", { name: "Project Experience" })).toBeInTheDocument();
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(csrfRequestMock.mock.calls[0][1].body))).toMatchObject({
      step: 3,
      experience: [
        { organization: "Northstar Labs", title: "Software Intern", start_date: "2025-05-01", end_date: "2025-07-01" },
        { organization: "Juniper Tech", title: "Backend Intern", start_date: "2024-06-01", end_date: null, is_current: true },
      ],
    });
  });

  it("lets students skip projects and skills without submitting partial content", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 4 });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Project Experience" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.change(screen.getByLabelText("Project Title"), { target: { value: "Draft project" } });
    fireEvent.click(screen.getByRole("button", { name: "Skip this step" }));

    expect(await screen.findByRole("heading", { name: "Career preferences" })).toBeInTheDocument();
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(1));
    const skipRequest = JSON.parse(String(csrfRequestMock.mock.calls[0][1].body)) as Record<string, unknown>;
    expect(skipRequest).toMatchObject({ step: 4 });
    expect(skipRequest).not.toHaveProperty("projects_skills");
    expect(screen.queryByText(/Projects and skills skipped/i)).not.toBeInTheDocument();
  });

  it("lets students say they have no projects and continue with an empty project list", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 4 });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Project Experience" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    expect(screen.queryByLabelText("Project Title")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    expect(await screen.findByRole("heading", { name: "Career preferences" })).toBeInTheDocument();
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(csrfRequestMock.mock.calls[0][1].body))).toMatchObject({
      step: 4,
      projects_skills: { projects: [], skills: [], certifications: [] },
    });
  });

  it("collects projects with a type, 300-character description, URL, and multi-select skill chips", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 4 });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Project Experience" })).toBeInTheDocument();
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

    fireEvent.change(screen.getByLabelText("Project Title"), { target: { value: "Campus Placement Portal" } });
    fireEvent.change(screen.getByLabelText("Project Type"), { target: { value: "academic" } });
    const description = screen.getByLabelText("What did you work on?");
    expect(description).toHaveAttribute("maxLength", "300");
    fireEvent.change(description, { target: { value: "Built a student placement portal with role-based dashboards." } });
    const project = screen.getByRole("region", { name: "Project experience" });
    fireEvent.click(within(project).getByRole("button", { name: "React" }));
    fireEvent.click(within(project).getByRole("button", { name: "PostgreSQL" }));
    fireEvent.change(screen.getByLabelText("Project link"), { target: { value: "https://example.com/project" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Project" }));

    expect(screen.getByText("Campus Placement Portal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Another Project" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(csrfRequestMock.mock.calls[0][1].body))).toMatchObject({
      step: 4,
      projects_skills: {
        projects: [{
          title: "Campus Placement Portal",
          project_type: "academic",
          description: "Built a student placement portal with role-based dashboards.",
          technologies: ["React", "PostgreSQL"],
          project_url: "https://example.com/project",
        }],
      },
    });
  });

  it("does not let students skip required placement consent to enter the workspace", async () => {
    apiRequestMock.mockResolvedValue({
      ...onboarding,
      current_step: 6,
      career_preferences: { target_roles: ["Software Engineer"] },
    });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Placement details" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: "Complete onboarding" }).closest("form")!);

    expect(await screen.findByText("Complete the required fields for this step. Your tab draft is still saved.")).toBeInTheDocument();
    expect(csrfRequestMock).not.toHaveBeenCalled();
  });

  it("keeps in-app notifications enabled and removes visibility and notification toggles", async () => {
    apiRequestMock.mockResolvedValue({
      ...onboarding,
      current_step: 6,
      career_preferences: { target_roles: ["Software Engineer"] },
    });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Placement details" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Profile visibility")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("In-app updates")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Placement cycle"), { target: { value: "2026–27" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /placement participation privacy notice/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed this information/i }));
    fireEvent.click(screen.getByRole("button", { name: "Complete onboarding" }));

    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/dashboard"));
    expect(JSON.parse(String(csrfRequestMock.mock.calls[0][1].body))).toMatchObject({
      step: 6,
      placement_participation: {
        communication_channels: ["in_app"],
        visibility: "placement_team",
      },
    });
  });

  it("keeps career preferences required without labeling required stages in the progress bar", async () => {
    apiRequestMock.mockResolvedValue({ ...onboarding, current_step: 5 });

    render(<StudentOnboardingWizard />);
    expect(await screen.findByRole("heading", { name: "Career preferences" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Student onboarding steps" })).not.toHaveTextContent(/required|compulsory/i);
    fireEvent.submit(screen.getByRole("button", { name: /save and continue/i }).closest("form")!);

    expect(await screen.findByText("Complete the required fields for this step. Your tab draft is still saved.")).toBeInTheDocument();
    expect(csrfRequestMock).not.toHaveBeenCalled();
  });

  it("keeps identity and education together while preserving the two-step API contract", async () => {
    render(<StudentOnboardingWizard />);
    await screen.findByRole("heading", { name: "Your profile" });

    const values: Record<string, string> = {
      "Full name": "Aarav Student",
      "PRN / enrollment ID": "PRN-12345",
      Branch: "Computer Engineering",
      "Graduation year": "2027",
      Degree: "BTech",
      "CGPA / percentage": "8.5",
    };
    expect(screen.getByLabelText("College")).toHaveValue("Campus University");
    expect(screen.getByLabelText("College")).toHaveAttribute("readonly");
    expect(screen.queryByLabelText("Department")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Awarding institution")).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "BE" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "BTech" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Information Technology" })).toBeInTheDocument();
    expect(screen.getByLabelText("Grading scale")).toHaveValue("cgpa_10");
    for (const [label, value] of Object.entries(values)) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: /save and continue/i }));

    expect(await screen.findByRole("heading", { name: "Experience" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Onboarding progress" })).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(csrfRequestMock.mock.calls[0][1].body))).toMatchObject({ step: 1, identity: { full_name: "Aarav Student", department: "Computer Engineering" } });
    expect(JSON.parse(String(csrfRequestMock.mock.calls[1][1].body))).toMatchObject({ step: 2, education: [{ degree: "BTech", branch: "Computer Engineering", institution: "Campus University", score_scale: "cgpa_10" }] });
  });

  it("keeps the selected college when an older tab draft contains a blank institution", async () => {
    window.sessionStorage.setItem("campushire.onboarding.v2.profile-1", JSON.stringify({
      revision: 0,
      step: 1,
      draft: { full_name: "Draft Student", institution_name: "" },
    }));

    render(<StudentOnboardingWizard />);

    expect(await screen.findByLabelText("College")).toHaveValue("Campus University");
    expect(screen.getByLabelText("Full name")).toHaveValue("Draft Student");
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
    fireEvent.submit(screen.getByRole("button", { name: "Complete onboarding" }).closest("form")!);
    expect(await screen.findByText("Review and confirm your profile before entering the workspace.")).toBeInTheDocument();
    expect(csrfRequestMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: /I reviewed this information and confirm it is accurate/i }));
    fireEvent.click(screen.getByRole("button", { name: "Complete onboarding" }));

    await waitFor(() => expect(routerReplaceMock).toHaveBeenCalledWith("/dashboard"));
    expect(csrfRequestMock.mock.calls.map((call) => JSON.parse(String(call[1].body)).step)).toEqual([6, 7]);
  });
});
