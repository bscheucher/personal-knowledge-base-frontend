import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDocument, listDocuments } from "../api/client.ts";

export const documentsKey = ["documents"] as const;

/** Fetches and caches the document list (newest first, per the backend). */
export function useDocuments() {
  return useQuery({
    queryKey: documentsKey,
    queryFn: listDocuments,
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
