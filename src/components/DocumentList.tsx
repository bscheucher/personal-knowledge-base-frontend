import type { DocumentResponse, DocumentStatus } from "../types";

const statusStyles: Record<DocumentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  PROCESSING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  ERROR: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

interface Props {
  documents: DocumentResponse[];
  onDelete: (id: string) => void;
  deletingId?: string;
}

export default function DocumentList({
  documents,
  onDelete,
  deletingId,
}: Props) {
  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No documents yet. Head to the Upload tab to add one.
      </p>
    );
  }

  return (
    <table className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
      <thead className="bg-slate-50 text-left text-slate-500">
        <tr>
          <th className="px-4 py-2 font-medium">Title</th>
          <th className="px-4 py-2 font-medium">Type</th>
          <th className="px-4 py-2 font-medium">Status</th>
          <th className="px-4 py-2 font-medium">Added</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td className="max-w-xs truncate px-4 py-2 font-medium" title={doc.title}>
              {doc.title}
            </td>
            <td className="px-4 py-2 text-slate-500">{doc.sourceType}</td>
            <td className="px-4 py-2">
              <StatusBadge status={doc.status} />
            </td>
            <td className="px-4 py-2 text-slate-500">
              {new Date(doc.createdAt).toLocaleString()}
            </td>
            <td className="px-4 py-2 text-right">
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {deletingId === doc.id ? "Deleting…" : "Delete"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
