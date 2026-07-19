import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, deleteDocument, ingestText, uploadPdf } from "./client.ts";

afterEach(() => vi.unstubAllGlobals());

describe("API client", () => {
  it("surfaces RFC-7807 details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Document is still processing" }), {
        status: 409,
        headers: { "Content-Type": "application/problem+json" },
      }),
    ));

    await expect(deleteDocument("doc-1")).rejects.toMatchObject({
      name: "ApiError",
      message: "Document is still processing",
      status: 409,
    });
  });

  it("falls back safely when an error body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad gateway", { status: 502 })));
    await expect(deleteDocument("doc-1")).rejects.toThrow("Request failed (502)");
  });

  it("sends text uploads as JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await ingestText("Notes", "Useful text");
    expect(fetchMock).toHaveBeenCalledWith("/api/documents/text", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ title: "Notes", text: "Useful text" }),
    }));
  });

  it("uploads PDFs as multipart data without forcing a content type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["pdf"], "notes.pdf", { type: "application/pdf" });
    await uploadPdf(file);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).toBeUndefined();
    expect((init.body as FormData).get("file")).toBe(file);
  });
});
