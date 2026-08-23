import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StudentRoadmap } from "./student-roadmap";

const { apiRequestMock, csrfRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  csrfRequestMock: vi.fn(),
}));
vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: apiRequestMock,
  csrfRequest: csrfRequestMock,
}));

const roadmap = {
  id: "roadmap-1",
  template_id: "template-1",
  slug: "ai-engineer",
  title: "AI Engineer",
  version: 1,
  summary: "Build grounded AI workflows with evaluation evidence.",
  completed_count: 1,
  nodes: [
    {
      key: "python",
      title: "Python foundations",
      completion: "Build one tested project",
      prerequisites: [],
      state: "completed",
      evidence: { label: "CLI project" },
    },
    {
      key: "math",
      title: "Applied statistics",
      completion: "Explain evaluation metrics",
      prerequisites: [],
      state: "next",
      evidence: {},
    },
    {
      key: "ml",
      title: "Machine-learning workflow",
      completion: "Train a baseline model",
      prerequisites: ["python", "math"],
      state: "locked",
      evidence: {},
    },
  ],
};

describe("StudentRoadmap", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    csrfRequestMock.mockReset();
    apiRequestMock.mockImplementation((path: string) =>
      path === "/roadmaps/templates"
        ? Promise.resolve([])
        : Promise.resolve(roadmap),
    );
  });

  it("reveals only prerequisite-ready milestones and records reviewed evidence", async () => {
    csrfRequestMock.mockResolvedValue({
      ...roadmap,
      completed_count: 2,
      nodes: roadmap.nodes.map((node) =>
        node.key === "math" ? { ...node, state: "completed" } : node,
      ),
    });
    render(<StudentRoadmap />);
    expect(
      await screen.findByRole("heading", { name: "AI Engineer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Prerequisites required")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Attach evidence" }));
    fireEvent.change(screen.getByLabelText("Evidence label"), {
      target: { value: "Metrics notebook" },
    });
    fireEvent.change(screen.getByLabelText("Internal evidence link"), {
      target: { value: "/resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm milestone" }));
    await waitFor(() =>
      expect(csrfRequestMock).toHaveBeenCalledWith(
        "/roadmaps/nodes/math",
        expect.objectContaining({
          body: expect.stringContaining("Metrics notebook"),
        }),
      ),
    );
  });
});
