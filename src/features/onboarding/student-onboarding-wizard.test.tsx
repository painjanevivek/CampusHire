import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StudentOnboardingWizard } from "./student-onboarding-wizard";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(() => new Promise(() => undefined)),
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api/client")>(),
  apiRequest: apiRequestMock,
  csrfRequest: vi.fn(),
}));

describe("StudentOnboardingWizard", () => {
  it("keeps the loading state inside a named main landmark", () => {
    render(<StudentOnboardingWizard />);

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("aria-busy", "true");
    expect(main).toContainElement(
      screen.getByRole("heading", { name: "Student onboarding" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading onboarding");
  });
});
