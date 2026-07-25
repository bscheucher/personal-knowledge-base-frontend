import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingestText, ingestUrl, uploadPdf } from "../api/client.ts";
import { documentsKey } from "./useDocuments.ts";

/**
 * Ingest mutations for the three source types. Ingest runs in the background on the backend, so
 * each mutation resolves with a PENDING document, not the final result. The document list is
 * refreshed on success, and `useDocuments` polls it until the document reaches READY or ERROR.
 */
export function useUpload() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: documentsKey });

  const text = useMutation({
    mutationFn: ({ title, text }: { title: string; text: string }) =>
      ingestText(title, text),
    onSuccess: invalidate,
  });

  const url = useMutation({
    mutationFn: (url: string) => ingestUrl(url),
    onSuccess: invalidate,
  });

  const pdf = useMutation({
    mutationFn: (file: File) => uploadPdf(file),
    onSuccess: invalidate,
  });

  return { text, url, pdf };
}
