import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "@/app/error";
import Loading from "@/app/loading";
import { AdminWorkspace } from "@/components/layout/admin-workspace";
import { StudentWorkspace } from "@/components/layout/student-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/features/engagement/notification-center", () => ({
  NotificationCenter: () => <button type="button" aria-label="Open updates">Updates</button>,
}));

async function expectNoAutomatedViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: {
      // jsdom cannot calculate rendered foreground/background contrast.
      "color-contrast": { enabled: false },
    },
  });
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

describe("critical shell accessibility", () => {
  it("has no automated structural violations in the student shell", async () => {
    const { container } = render(
      <StudentWorkspace>
        <main id="main-content"><h1>Readiness</h1><p>One clear next action.</p></main>
      </StudentWorkspace>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("has no automated structural violations in the admin shell", async () => {
    const { container } = render(
      <AdminWorkspace>
        <main id="main-content"><h1>Operations</h1><p>Durable job state.</p></main>
      </AdminWorkspace>,
    );
    await expectNoAutomatedViolations(container);
  });

  it("announces loading and error recovery states accessibly", async () => {
    const loading = render(<Loading />);
    await expectNoAutomatedViolations(loading.container);
    loading.unmount();

    const error = render(<ErrorPage reset={vi.fn()} />);
    await expectNoAutomatedViolations(error.container);
  });
});
