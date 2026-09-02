import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input, Select } from "./form-controls";

describe("form controls", () => {
  it("connects an input error to an announced message", () => {
    render(<Input id="email" label="College email" error="Use an institutional email." />);

    expect(screen.getByLabelText("College email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("College email")).toHaveAccessibleDescription(
      "Use an institutional email.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Use an institutional email.");
  });

  it("keeps non-error select guidance descriptive without announcing it as an error", () => {
    render(
      <Select id="role" label="Target role" hint="Choose the closest published role.">
        <option>Software engineer</option>
      </Select>,
    );

    expect(screen.getByLabelText("Target role")).toHaveAccessibleDescription(
      "Choose the closest published role.",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
