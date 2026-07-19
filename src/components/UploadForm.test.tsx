import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UploadForm from "./UploadForm.tsx";

const mutate = vi.fn();
const mutation = { mutate, isPending: false, isSuccess: false, isError: false };

vi.mock("../hooks/useUpload.ts", () => ({
  useUpload: () => ({ text: mutation, url: mutation, pdf: mutation }),
}));

describe("UploadForm", () => {
  beforeEach(() => mutate.mockReset());

  it("submits entered text", async () => {
    const user = userEvent.setup();
    render(<UploadForm />);
    await user.type(screen.getByPlaceholderText("Title (optional)"), "My notes");
    await user.type(screen.getByPlaceholderText(/Paste text/), "Test content");
    await user.click(screen.getByRole("button", { name: "Add to knowledge base" }));
    expect(mutate).toHaveBeenCalledWith(
      { title: "My notes", text: "Test content" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("does not submit the PDF tab without a file", async () => {
    const user = userEvent.setup();
    render(<UploadForm />);
    await user.click(screen.getByRole("button", { name: "PDF" }));
    await user.click(screen.getByRole("button", { name: "Add to knowledge base" }));
    expect(mutate).not.toHaveBeenCalled();
  });
});
