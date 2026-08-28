import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceBanner } from "./service-banner";

describe("ServiceBanner", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("progressively discloses a configured maintenance state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "maintenance", maintenance_message: "Database maintenance from 02:00 to 02:15.", transactional_email: "configured" }), { status: 200, headers: { "Content-Type": "application/json" } })));
    render(await ServiceBanner());
    expect(screen.getByRole("status")).toHaveTextContent("Database maintenance");
    expect(screen.getByRole("link", { name: "View service status" })).toHaveAttribute("href", "/status");
  });

  it("does not add noise during normal operations", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "operational", maintenance_message: null, transactional_email: "configured" }), { status: 200, headers: { "Content-Type": "application/json" } })));
    render(await ServiceBanner());
    expect(fetch).toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
