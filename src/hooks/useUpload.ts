import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ingestText, ingestUrl, uploadPdf } from "../api/client.ts";
import { documentsKey } from "./useDocuments.ts";

/**
 * Ingest mutations for the three source types. Ingest is synchronous on the
 * backend, so each mutation resolves with the already-final document (READY or
 * ERROR) — there is no separate status to poll. The document list is refreshed
 * on success.
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
