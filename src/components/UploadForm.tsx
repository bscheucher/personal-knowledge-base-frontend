import { useState } from "react";
import { useUpload } from "../hooks/useUpload.ts";
import { ApiError } from "../api/client.ts";

type Tab = "text" | "url" | "pdf";

const tabs: { id: Tab; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "url", label: "URL" },
  { id: "pdf", label: "PDF" },
];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export default function UploadForm() {
  const [tab, setTab] = useState<Tab>("text");
  const { text, url, pdf } = useUpload();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const active = tab === "text" ? text : tab === "url" ? url : pdf;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "text") {
      text.mutate(
        { title, text: body },
        { onSuccess: () => setBody("") },
      );
    } else if (tab === "url") {
      url.mutate(urlValue, { onSuccess: () => setUrlValue("") });
    } else if (file) {
      pdf.mutate(file, { onSuccess: () => setFile(null) });
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-6 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === t.id
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {tab === "text" && (
          <>
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              required
              placeholder="Paste text to add to the knowledge base…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </>
        )}

        {tab === "url" && (
          <input
            type="url"
            required
            placeholder="https://example.com/article"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        )}

        {tab === "pdf" && (
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white"
          />
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={active.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {active.isPending ? "Ingesting…" : "Add to knowledge base"}
          </button>
          {active.isSuccess && (
            <span className="text-sm text-emerald-600">
              Added “{active.data.title}” — processing in the background.
            </span>
          )}
          {active.isError && (
            <span className="text-sm text-red-600">
              {errorMessage(active.error)}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
