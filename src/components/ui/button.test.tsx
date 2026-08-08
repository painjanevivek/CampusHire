import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ButtonLink } from "./button";

describe("ButtonLink", () => {
  it("keeps native link semantics", () => {
    render(<ButtonLink href="/sign-up">Create profile</ButtonLink>);
    expect(screen.getByRole("link", { name: "Create profile" })).toHaveAttribute("href", "/sign-up");
  });
});
