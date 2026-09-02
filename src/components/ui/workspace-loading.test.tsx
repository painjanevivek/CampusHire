import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceLoading } from "./workspace-loading";

describe("WorkspaceLoading", () => {
  it("exposes a stable busy main region with a loading heading", () => {
    render(<WorkspaceLoading label="Loading student workspace" />);

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Loading student workspace",
    );
  });
});
