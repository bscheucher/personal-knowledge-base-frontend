import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentList from "./DocumentList.tsx";
import type { DocumentResponse } from "../types";

function doc(overrides: Partial<DocumentResponse>): DocumentResponse {
  return {
    id: "1",
    title: "My document",
    sourceType: "TEXT",
    status: "READY",
    failureReason: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("DocumentList", () => {
  it("shows the failure reason for an ERROR document", () => {
    render(
      <DocumentList
        documents={[doc({ status: "ERROR", failureReason: "The URL could not be fetched safely" })]}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("The URL could not be fetched safely")).toBeInTheDocument();
  });

  it("does not show a failure reason for a READY document", () => {
    render(<DocumentList documents={[doc({ status: "READY" })]} onDelete={vi.fn()} />);

    expect(screen.queryByText(/could not/)).not.toBeInTheDocument();
  });
});
