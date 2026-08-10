import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResumeWorkspace } from "./resume-workspace";

const { csrfRequestMock } = vi.hoisted(() => ({ csrfRequestMock: vi.fn() }));

vi.mock("@/lib/api/client", () => ({ csrfRequest: csrfRequestMock }));

describe("ResumeWorkspace", () => {
  beforeEach(() => csrfRequestMock.mockReset());

  it("uses the shared student page language", () => {
    render(<ResumeWorkspace />);
    expect(screen.getByRole("heading", { name: "Resume" })).toBeInTheDocument();
  });

  it("preserves the selected filename when upload fails", async () => {
    csrfRequestMock.mockRejectedValueOnce(new Error("offline"));
    render(<ResumeWorkspace />);

    const file = new File(["resume"], "asha-resume.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Resume PDF"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not be accepted");
    expect(screen.getByText("asha-resume.pdf")).toBeInTheDocument();
  });

  it("announces a successful immutable resume version", async () => {
    csrfRequestMock.mockResolvedValueOnce({});
    render(<ResumeWorkspace />);

    const file = new File(["resume"], "asha-resume.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Resume PDF"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));

    expect(await screen.findByRole("status")).toHaveTextContent("immutable version");
  });
});
