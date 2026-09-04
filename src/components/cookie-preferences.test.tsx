import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CookiePreferences } from "./cookie-preferences";

describe("CookiePreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the essential-only receipt until the preference is saved", async () => {
    render(<CookiePreferences />);

    expect(await screen.findByRole("heading", { name: "Cookies with a security job." })).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save essential-only preference" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Cookies with a security job." })).not.toBeInTheDocument();
    });
    expect(window.localStorage.getItem("campushire_cookie_preference_v1")).toBe("essential-only");
    expect(screen.getByRole("button", { name: "Cookie settings" })).toHaveFocus();
  });

  it("keeps a persistent control for reopening saved preferences", async () => {
    window.localStorage.setItem("campushire_cookie_preference_v1", "essential-only");
    render(<CookiePreferences />);

    const settings = await screen.findByRole("button", { name: "Cookie settings" });
    fireEvent.click(settings);

    expect(await screen.findByRole("heading", { name: "Cookies with a security job." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save essential-only preference" })).toHaveFocus();
  });
});
