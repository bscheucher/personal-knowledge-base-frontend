import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, listDocuments } from "../api/client.ts";
import type { DocumentResponse } from "../types";

export const documentsKey = ["documents"] as const;

const POLL_INTERVAL_MS = 2000;

/** True while any document is still being ingested in the background. */
export function hasActiveDocuments(documents: DocumentResponse[] | undefined): boolean {
  return (documents ?? []).some(
    (doc) => doc.status === "PENDING" || doc.status === "PROCESSING",
  );
}

/**
 * Fetches and caches the document list (newest first, per the backend). Ingestion runs in the
 * background, so this polls every {@link POLL_INTERVAL_MS} while any document is still
 * PENDING/PROCESSING and stops once everything has reached a terminal state.
 */
export function useDocuments() {
  return useQuery({
    queryKey: documentsKey,
    queryFn: listDocuments,
    refetchInterval: (query) =>
      hasActiveDocuments(query.state.data) ? POLL_INTERVAL_MS : false,
  });
}

/** Deletes a document and refreshes the list on success. */
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}
