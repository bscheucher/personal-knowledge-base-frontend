import type { DocumentResponse } from "../types";

/**
 * Thin fetch wrapper around the backend REST API. Requests go to `/api/*` and are
 * forwarded to the backend by the Vite dev proxy (see vite.config.ts).
 */

/** RFC-7807 ProblemDetail shape returned by the backend's GlobalExceptionHandler. */
interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const problem = (await res.json()) as ProblemDetail;
      message = problem.detail || problem.title || message;
    } catch {
      // response had no JSON body; keep the default message
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listDocuments(): Promise<DocumentResponse[]> {
  return fetch("/api/documents").then((r) => handle<DocumentResponse[]>(r));
}

export function deleteDocument(id: string): Promise<void> {
  return fetch(`/api/documents/${id}`, { method: "DELETE" }).then((r) =>
    handle<void>(r),
  );
}

export function ingestText(
  title: string,
  text: string,
): Promise<DocumentResponse> {
  return fetch("/api/documents/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, text }),
  }).then((r) => handle<DocumentResponse>(r));
}

export function ingestUrl(url: string): Promise<DocumentResponse> {
  return fetch("/api/documents/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).then((r) => handle<DocumentResponse>(r));
}

export function uploadPdf(file: File): Promise<DocumentResponse> {
  const form = new FormData();
  form.append("file", file);
  return fetch("/api/documents/upload", {
    method: "POST",
    body: form,
  }).then((r) => handle<DocumentResponse>(r));
}
