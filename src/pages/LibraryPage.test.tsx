import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LibraryPage from "./LibraryPage.tsx";

vi.mock("../hooks/useDocuments.ts", () => ({
  useDocuments: () => ({ data: [] }),
  useDeleteDocument: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: true,
    error: new Error("Delete was rejected"),
  }),
}));

describe("LibraryPage", () => {
  it("shows document deletion errors", () => {
    render(<LibraryPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not delete document: Delete was rejected",
    );
  });
});
