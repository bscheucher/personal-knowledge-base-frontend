export type SourceType = "PDF" | "URL" | "TEXT";

export type DocumentStatus = "PENDING" | "PROCESSING" | "READY" | "ERROR";

/** Mirrors the backend `DocumentResponse` record. */
export interface DocumentResponse {
  id: string;
  title: string;
  sourceType: SourceType;
  status: DocumentStatus;
  failureReason: string | null;
  createdAt: string;
}

export interface ChatMessageModel {
  role: "user" | "assistant";
  content: string;
  delivery?: "complete" | "interrupted";
}
