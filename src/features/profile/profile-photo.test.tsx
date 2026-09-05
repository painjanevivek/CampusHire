import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePhotoProvider, ProfilePhotoUpload } from "./profile-photo";

const { read, mutate } = vi.hoisted(() => ({ read: vi.fn(), mutate: vi.fn() }));
vi.mock("@/lib/api/client", async importOriginal => ({ ...await importOriginal<object>(), cachedApiRequest: read, csrfRequest: mutate }));
const dataUrl = "data:image/jpeg;base64,cGhvdG8=";

describe("Profile photo", () => {
  beforeEach(() => { read.mockReset().mockResolvedValue({ data_url: null }); mutate.mockReset(); });
  it("uploads through the protected API and updates the avatar, then removes it", async () => {
    mutate.mockResolvedValue({ data_url: dataUrl });
    const { container } = render(<ProfilePhotoProvider><ProfilePhotoUpload /></ProfilePhotoProvider>);
    await waitFor(() => expect(read).toHaveBeenCalledWith("/profile/photo"));
    const file = new File(["photo"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose profile photo"), { target: { files: [file] } });
    expect(await screen.findByText("Profile photo updated.")).toBeInTheDocument();
    expect(mutate).toHaveBeenCalledWith("/profile/photo", { method: "PUT", body: expect.any(FormData) });
    expect(container.querySelector("img")).toHaveAttribute("src", dataUrl);
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(await screen.findByText("Profile photo removed.")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
  it("rejects unsupported files without sending them", async () => {
    render(<ProfilePhotoProvider><ProfilePhotoUpload /></ProfilePhotoProvider>);
    fireEvent.change(screen.getByLabelText("Choose profile photo"), { target: { files: [new File(["svg"], "x.svg", { type: "image/svg+xml" })] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("JPEG or PNG");
    expect(mutate).not.toHaveBeenCalled();
  });
  it("retains the saved avatar when upload fails", async () => {
    read.mockResolvedValue({ data_url: dataUrl }); mutate.mockRejectedValue(new Error("offline"));
    const { container } = render(<ProfilePhotoProvider><ProfilePhotoUpload /></ProfilePhotoProvider>);
    await screen.findByRole("button", { name: "Change photo" });
    fireEvent.change(screen.getByLabelText("Choose profile photo"), { target: { files: [new File(["photo"], "x.png", { type: "image/png" })] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be saved");
    expect(container.querySelector("img")).toHaveAttribute("src", dataUrl);
  });
});
