# Knowledge base — frontend

React UI for the [knowledge-base backend](https://github.com/bscheucher/personal-knowledge-base-backend):
browse your library, ingest documents (text / URL / PDF), and chat with answers grounded in your own
content (streamed token-by-token over SSE).

Stack: React 19 + TypeScript, Vite, React Router, TanStack Query, Tailwind CSS v4.

## Prerequisites

- Node.js 20+ (developed on 22)
- The backend running on `http://localhost:8080`

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Requests to `/api/*` are proxied to the backend on `:8080` (see `vite.config.ts`). The proxy keeps
everything same-origin, which matters for the chat `EventSource` — it cannot send custom headers and
would otherwise be blocked by CORS. If the backend lives elsewhere, change the proxy `target`.

```bash
npm run build    # type-check (tsc -b) + production bundle into dist/
npm run lint     # type-check only
npm run preview  # serve the production build locally
```

## Structure

```
src/
├── api/client.ts      # fetch wrappers + ApiError (parses RFC-7807 ProblemDetail)
├── hooks/             # useDocuments, useUpload, useChat (EventSource SSE)
├── components/        # Layout, DocumentList, UploadForm, ChatWindow, ChatMessage
├── pages/             # LibraryPage (/), UploadPage (/upload), ChatPage (/chat)
└── types.ts           # mirrors the backend DocumentResponse / enums
```

## Notes

- **Ingest is synchronous** on the backend, so an upload resolves with the already-final document
  (`READY` or `ERROR`); there is no intermediate status to poll. The library list is refetched on
  success via TanStack Query invalidation.
- The chat stream has no explicit "done" event — the backend's reactive stream completes and closes
  the connection, which `useChat` treats as end-of-stream (and prevents EventSource auto-reconnect).
- **No source attribution yet.** The spec's `SourceCard` is deferred because the backend's
  `/api/chat/stream` returns only answer tokens, not the retrieved chunks. Add it once the backend
  surfaces sources.
