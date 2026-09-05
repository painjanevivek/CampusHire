import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { GuidedPublishing } from "./guided-publishing";
import type { Drive } from "@/features/recruitment/types";
const get = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ apiRequest: get }));
const drive = { id: "drive-1", title: "Engineering", company_name: "Example", role_count: 1, status: "draft", updated_at: "2026-09-05T00:00:00Z" } as Drive;
it("requires a verified preview and explicit confirmation to publish", async () => {
  get.mockResolvedValue({ title: "Engineering", company_name: "Example", opens_at: "2026-09-01T00:00:00Z", deadline_at: "2027-01-01T00:00:00Z", blockers: [], roles: [], pending_changes: {} });
  const publish = vi.fn(); render(<GuidedPublishing drive={drive} step={5} onStep={vi.fn()} onEdit={vi.fn()} onPublish={publish} busy={false} />);
  const button = await screen.findByRole("button", { name: "Confirm and publish drive" });
  expect(publish).not.toHaveBeenCalled(); fireEvent.click(button); expect(publish).toHaveBeenCalledOnce();
});
it("disables publication and explains an authoritative blocker", async () => {
  get.mockResolvedValue({ title: "Engineering", company_name: "Example", opens_at: "2026-09-01T00:00:00Z", deadline_at: "2027-01-01T00:00:00Z", blockers: ["Publish a role first."], roles: [], pending_changes: {} });
  render(<GuidedPublishing drive={drive} step={5} onStep={vi.fn()} onEdit={vi.fn()} onPublish={vi.fn()} busy={false} />);
  expect(await screen.findByText("Publish a role first.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Confirm and publish drive" })).toBeDisabled();
});
