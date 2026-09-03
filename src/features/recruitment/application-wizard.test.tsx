import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationWizard } from "./application-wizard";

const { apiRequestMock, csrfRequestMock, pushMock, replaceMock, routerMock } = vi.hoisted(() => {
  const push = vi.fn();
  const replace = vi.fn();
  return {
    apiRequestMock: vi.fn(),
    csrfRequestMock: vi.fn(),
    pushMock: push,
    replaceMock: replace,
    routerMock: { push, replace },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
  apiPath: (path: string) => `http://api.test${path}`,
}));

const resume = {
  id: "resume-1",
  version_number: 2,
  original_name: "asha-product-resume.pdf",
  status: "completed",
  scan_status: "clean",
  created_at: "2026-09-03T10:00:00Z",
  parent_version_id: null,
};

const form = {
  id: "form-1",
  role_id: "role-1",
  version: 1,
  status: "published",
  purpose: "Equal opportunity monitoring for aggregate compliance reporting.",
  compliance_owner: "Placement compliance office",
  retention_days: 180,
  questions: [
    {
      id: "work_authorization",
      prompt: "Are you currently authorized to work in India?",
      type: "boolean",
      options: [],
    },
  ],
  published_at: "2026-09-01T10:00:00Z",
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

const baseDraft = {
  id: "draft-1",
  role_id: "role-1",
  role_title: "Associate Front-End Engineer",
  company_name: "Nexora Labs",
  deadline_at: "2026-09-20T10:00:00Z",
  current_step: "resume",
  revision: 1,
  expires_at: "2026-10-20T10:00:00Z",
  last_saved_at: "2026-09-03T10:00:00Z",
  profile_revision: null,
  resume: null,
  form,
  disclosure_answers: {},
  disclosure_completed: false,
  submitted_application_id: null,
};

const profile = {
  id: "profile-1",
  account_email: "asha@example.edu",
  full_name: "Asha Patil",
  department: "Computer Science",
  academic_year: "Final year",
  phone: "+91 90000 00000",
  city: "Pune",
  country_code: "IN",
  education: [{ degree: "B.Tech", branch: "Computer Science", institution: "Campus One" }],
  revision: 4,
  updated_at: "2026-09-03T09:00:00Z",
};

const editableContent = {
  full_name: "Asha Patil",
  email: "asha@example.edu",
  phone: "+91 90000 00000",
  github_url: "https://github.com/asha",
  portfolio_url: null,
  summary: "Frontend engineer focused on accessible interfaces.",
  skills: ["React", "TypeScript"],
  projects: ["Campus placement portal"],
  education: ["B.Tech Computer Science"],
};

function draftAt(
  current_step: string,
  revision: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    ...baseDraft,
    current_step,
    revision,
    resume,
    last_saved_at: `2026-09-03T10:0${revision}:00Z`,
    ...overrides,
  };
}

describe("ApplicationWizard", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    pushMock.mockReset();
    replaceMock.mockReset();

    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/resumes") return Promise.resolve([resume]);
      if (path === "/profile") return Promise.resolve(profile);
      if (path.endsWith("/editable-content")) return Promise.resolve(editableContent);
      if (path === "/resumes/upload-1") {
        return Promise.resolve({ ...resume, id: "upload-1", original_name: "role-upload.pdf" });
      }
      if (path.endsWith("/review")) {
        return Promise.resolve({
          draft: draftAt("review", 4, { disclosure_completed: true }),
          profile_snapshot: {
            full_name: "Asha Patil",
            email: "asha@example.edu",
            phone: "+91 90000 00000",
            department: "Computer Science",
            academic_year: "Final year",
            city: "Pune",
            country_code: "IN",
          },
          immutable_notice: "After submission, this application becomes an immutable snapshot.",
        });
      }
      throw new Error(`Unexpected API request: ${path}`);
    });

    csrfRequestMock.mockImplementation((path: string) => {
      if (path === "/opportunities/role-1/application-draft") {
        return Promise.resolve(baseDraft);
      }
      if (path.endsWith("/resume")) return Promise.resolve(draftAt("profile", 2));
      if (path.endsWith("/profile-confirmation")) {
        return Promise.resolve(draftAt("disclosures", 3, { profile_revision: 4 }));
      }
      if (path.endsWith("/disclosures")) {
        return Promise.resolve(draftAt("review", 4, { disclosure_completed: true }));
      }
      if (path.endsWith("/submit")) return Promise.resolve({ id: "application-1" });
      if (path.endsWith("/tailored-versions")) {
        return Promise.resolve({
          ...resume,
          id: "resume-tailored",
          version_number: 3,
          original_name: "campushire-resume-v3.pdf",
          parent_version_id: "resume-1",
        });
      }
      if (path === "/resumes") {
        return Promise.resolve({
          id: "upload-1",
          version_number: 3,
          status: "queued",
          scan_status: "quarantined",
          duplicate: false,
          job_id: "job-1",
        });
      }
      throw new Error(`Unexpected CSRF request: ${path}`);
    });
  });

  it("completes the four-step packet and preserves safe submission retry identity", async () => {
    render(<ApplicationWizard roleId="role-1" />);

    expect(await screen.findByRole("heading", { name: "Associate Front-End Engineer", level: 1 }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resume.*For this role/ }))
      .toHaveAttribute("aria-current", "step");

    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(await screen.findByRole("heading", { name: "Confirm your profile details" }))
      .toBeInTheDocument();
    expect(screen.getByDisplayValue("asha@example.edu")).toHaveAttribute("readonly");
    expect(screen.getByText(/Street address is not requested/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Confirm and continue/ }));
    const disclosure = await screen.findByRole("combobox", {
      name: "Are you currently authorized to work in India?",
    });
    fireEvent.change(disclosure, { target: { value: "prefer_not_to_answer" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue to review/ }));

    expect(await screen.findByRole("heading", { name: "Review the exact packet" }))
      .toBeInTheDocument();
    expect(screen.getByText(/Hiring reviewers see collection status only/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /I confirm this application is accurate/ }));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/applications/application-1"));
    expect(csrfRequestMock).toHaveBeenCalledWith(
      "/application-drafts/draft-1/submit",
      expect.objectContaining({
        headers: { "Idempotency-Key": expect.any(String) },
        body: expect.stringContaining("I CONFIRM THIS APPLICATION IS ACCURATE"),
      }),
    );
  });

  it("creates and selects an immutable tailored child while preserving its source", async () => {
    render(<ApplicationWizard roleId="role-1" />);
    await screen.findByRole("heading", { name: "Choose the resume for this role" });
    fireEvent.click(screen.getByRole("radio", { name: /Tailor a copy/ }));
    fireEvent.click(screen.getByRole("button", { name: /Open embedded editor/ }));
    expect(await screen.findByDisplayValue(/Frontend engineer focused/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Frontend engineer tailoring evidence for this role." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create immutable tailored PDF/ }));

    expect(await screen.findByText(/source resume remains unchanged/i)).toBeInTheDocument();
    expect(csrfRequestMock).toHaveBeenCalledWith(
      "/resumes/resume-1/tailored-versions",
      expect.objectContaining({ body: expect.stringContaining("role-1") }),
    );
  });

  it("accepts only a processed clean PDF from the upload path", async () => {
    render(<ApplicationWizard roleId="role-1" />);
    await screen.findByRole("heading", { name: "Choose the resume for this role" });
    fireEvent.click(screen.getByRole("radio", { name: /Upload PDF/ }));
    const file = new File(["%PDF-1.7"], "role-upload.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(screen.getByLabelText("Choose resume PDF"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload and process" }));

    expect(await screen.findByText(/clean, completed, and selected/i)).toBeInTheDocument();
    expect(csrfRequestMock).toHaveBeenCalledWith(
      "/resumes",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });

  it("restores the exact review packet when a saved draft resumes on the review step", async () => {
    csrfRequestMock.mockImplementation((path: string) => {
      if (path === "/opportunities/role-1/application-draft") {
        return Promise.resolve(
          draftAt("review", 4, { profile_revision: 4, disclosure_completed: true }),
        );
      }
      throw new Error(`Unexpected CSRF request: ${path}`);
    });

    render(<ApplicationWizard roleId="role-1" />);

    expect(await screen.findByRole("heading", { name: "Review the exact packet" }))
      .toBeInTheDocument();
    expect(screen.getByText("Asha Patil")).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledWith(
      "/application-drafts/draft-1/review",
      { cache: "no-store" },
    );
  });
});
