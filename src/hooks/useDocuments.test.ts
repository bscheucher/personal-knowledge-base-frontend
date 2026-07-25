import { describe, expect, it } from "vitest";
import { hasActiveDocuments } from "./useDocuments.ts";
import type { DocumentResponse } from "../types";

function doc(status: DocumentResponse["status"]): DocumentResponse {
  return {
    id: `${status}-${Math.random()}`,
    title: "doc",
    sourceType: "TEXT",
    status,
    failureReason: null,
    createdAt: new Date().toISOString(),
  };
}

describe("hasActiveDocuments", () => {
  it("is false for an empty list", () => {
    expect(hasActiveDocuments([])).toBe(false);
  });

  it("is false when undefined", () => {
    expect(hasActiveDocuments(undefined)).toBe(false);
  });

  it("is false when every document is terminal", () => {
    expect(hasActiveDocuments([doc("READY"), doc("ERROR")])).toBe(false);
  });

  it("is true when a document is PENDING", () => {
    expect(hasActiveDocuments([doc("READY"), doc("PENDING")])).toBe(true);
  });

  it("is true when a document is PROCESSING", () => {
    expect(hasActiveDocuments([doc("PROCESSING")])).toBe(true);
  });
});
