import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDrives } from "./admin-drives";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const company = {
  id: "company-1",
  name: "Nexora Labs",
  website_url: "https://example.com",
  description: null,
  status: "active",
  created_at: "2026-09-01T08:00:00Z",
  updated_at: "2026-09-01T08:00:00Z",
};

const draftDrive = {
  id: "drive-draft",
  company_id: company.id,
  company_name: company.name,
  title: "Graduate engineering draft",
  description: "A draft placement drive awaiting administrator review.",
  location: "Pune, India",
  work_mode: "hybrid",
  opens_at: "2026-09-05T03:30:00Z",
  deadline_at: "2026-09-12T12:30:00Z",
  status: "draft",
  published_at: null,
  created_at: "2026-09-01T08:00:00Z",
  updated_at: "2026-09-01T08:00:00Z",
  role_count: 0,
};

const publishedDrive = {
  ...draftDrive,
  id: "drive-published",
  title: "Published engineering drive",
  status: "published",
  published_at: "2026-09-02T08:00:00Z",
};

const draftRole = {
  id: "role-1",
  drive_id: draftDrive.id,
  company_name: company.name,
  drive_title: draftDrive.title,
  title: "Software Engineer",
  description: "Build reliable campus recruitment products.",
  employment_type: "full-time",
  location: "Pune, India",
  work_mode: "hybrid",
  salary_display: null,
  skills: ["TypeScript"],
  requirements: ["B.Tech"],
  status: "draft",
  published_at: null,
  deadline_at: draftDrive.deadline_at,
};

const approvedPolicy = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Placement eligibility policy",
  version: 2,
  source_reference: "placement-policy-v2.pdf",
  sections: [],
  status: "approved",
  review_reason: "Approved by the policy owner.",
  approved_at: "2026-09-01T08:00:00Z",
  created_at: "2026-09-01T08:00:00Z",
  updated_at: "2026-09-01T08:00:00Z",
};

describe("AdminDrives draft management", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/admin/recruitment/companies") return Promise.resolve([company]);
      if (path === "/admin/recruitment/drives") {
        return Promise.resolve([draftDrive, publishedDrive]);
      }
      if (path.includes("/roles")) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("edits and deletes only the selected draft drive", async () => {
    const updatedDrive = {
      ...draftDrive,
      title: "Updated graduate engineering draft",
      work_mode: "remote",
    };
    csrfRequestMock.mockImplementation((path: string, init: RequestInit) => {
      if (path === "/admin/recruitment/drives/drive-draft" && init.method === "PATCH") {
        return Promise.resolve(updatedDrive);
      }
      if (path === "/admin/recruitment/drives/drive-draft" && init.method === "DELETE") {
        return Promise.resolve(undefined);
      }
      return Promise.reject(new Error(`Unexpected request: ${init.method} ${path}`));
    });

    render(<AdminDrives />);

    expect(await screen.findByRole("button", { name: "Edit draft" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete draft" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit draft" }));
    expect(screen.getByRole("heading", { name: "Edit draft drive" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Drive title"), {
      target: { value: updatedDrive.title },
    });
    fireEvent.change(screen.getByLabelText("Work mode"), {
      target: { value: "remote" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/admin/recruitment/drives/drive-draft",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("Updated graduate engineering draft"),
        }),
      ),
    );
    expect(await screen.findByText("Draft drive updated.")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Edit draft drive" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete draft" }));
    expect(window.confirm).toHaveBeenCalledWith(
      "Delete the draft “Updated graduate engineering draft”? This also removes its draft roles and eligibility setup. This cannot be undone.",
    );
    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/admin/recruitment/drives/drive-draft",
        { method: "DELETE" },
      ),
    );
    expect(await screen.findByText("Draft drive deleted.")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Edit draft drive" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete draft" })).not.toBeInTheDocument();
  });

  it("locks approved policy versions into a new eligibility rule version", async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/admin/recruitment/companies") return Promise.resolve([company]);
      if (path === "/admin/recruitment/drives") return Promise.resolve([draftDrive]);
      if (path === "/admin/intelligence/policies") return Promise.resolve([approvedPolicy]);
      if (path === "/admin/recruitment/drives/drive-draft/roles") {
        return Promise.resolve([draftRole]);
      }
      return Promise.resolve([]);
    });
    csrfRequestMock.mockResolvedValue({
      id: "rules-2",
      role_id: draftRole.id,
      version: 2,
      status: "draft",
      rules: [],
      policy_references: [{
        id: approvedPolicy.id,
        title: approvedPolicy.title,
        version: approvedPolicy.version,
        source_reference: approvedPolicy.source_reference,
        approved_at: approvedPolicy.approved_at,
      }],
      created_by_user_id: "admin-1",
      published_at: null,
      created_at: "2026-09-02T08:00:00Z",
      updated_at: "2026-09-02T08:00:00Z",
    });

    render(<AdminDrives />);
    fireEvent.click(await screen.findByRole("button", { name: "New rule version" }));
    fireEvent.click(screen.getByLabelText(/Placement eligibility policy/));
    fireEvent.click(screen.getByRole("button", { name: "Create draft version" }));

    await waitFor(() => expect(csrfRequestMock).toHaveBeenCalledWith(
      "/admin/recruitment/roles/role-1/rule-sets",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(approvedPolicy.id),
      }),
    ));
  });
});
