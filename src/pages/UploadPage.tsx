import UploadForm from "../components/UploadForm.tsx";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upload</h1>
      <p className="text-sm text-slate-500">
        Add a document by pasting text, fetching a URL, or uploading a PDF. It is
        chunked, embedded, and stored so you can chat with it.
      </p>
      <UploadForm />
    </div>
  );
}
