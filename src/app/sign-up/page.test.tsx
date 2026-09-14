import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignUpPage from "./page";

vi.mock("@/features/auth/sign-up-form", () => ({
  SignUpForm: () => <form aria-label="Student sign-up form" />,
}));

describe("SignUpPage", () => {
  it("places the seven follow-up information steps after the student form", () => {
    render(<SignUpPage />);

    const form = screen.getByRole("form", { name: "Student sign-up form" });
    const journey = screen.getByRole("complementary", {
      name: "Information collected after sign-up",
    });
    expect(form.compareDocumentPosition(journey) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(journey).getAllByRole("listitem")).toHaveLength(7);
  });
});
