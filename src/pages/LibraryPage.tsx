import { useDeleteDocument, useDocuments } from "../hooks/useDocuments.ts";
import DocumentList from "../components/DocumentList.tsx";

export default function LibraryPage() {
  const { data, isLoading, isError, error } = useDocuments();
  const del = useDeleteDocument();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Library</h1>

      {isLoading && <p className="text-slate-500">Loading documents…</p>}

      {isError && (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Could not load documents:{" "}
          {error instanceof Error ? error.message : "unknown error"}
        </p>
      )}

      {del.isError && (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Could not delete document: {del.error instanceof Error ? del.error.message : "unknown error"}
        </p>
      )}

      {data && (
        <DocumentList
          documents={data}
          onDelete={(id) => del.mutate(id)}
          deletingId={del.isPending ? del.variables : undefined}
        />
      )}
    </div>
  );
}
