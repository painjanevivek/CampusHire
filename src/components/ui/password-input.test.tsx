import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("shows and hides the password with an accessible toggle", () => {
    const { container } = render(<PasswordInput id="password" name="password" label="Password" />);
    const input = screen.getByLabelText("Password");

    expect(input).toHaveAttribute("type", "password");
    expect(container.querySelector(".lucide-eye-off")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(container.querySelector(".lucide-eye")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
    expect(container.querySelector(".lucide-eye-off")).toBeInTheDocument();
  });
});
