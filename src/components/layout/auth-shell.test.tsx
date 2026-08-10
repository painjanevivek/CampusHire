import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("keeps authentication connected to the public CampusHire navigation", () => {
    render(
      <AuthShell eyebrow="Welcome" title="Sign in" description="Continue." footer="Footer">
        <form aria-label="Sign in form" />
      </AuthShell>,
    );

    expect(screen.getByRole("link", { name: "CampusHire home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Find opportunities" })).toHaveAttribute("href", "/opportunities");
  });
});
