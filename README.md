# Scribe — a lightweight collaborative document editor

Built for the Ajaia LLC Full Stack Product Engineer take-home.

Scribe lets a small team create, edit, import, and share rich-text documents.
It's deliberately scoped: no real-time co-editing, no granular permission
tiers beyond edit/view, no rich media embeds. See `ARCHITECTURE.md` for the
reasoning behind those cuts.

## What's included

- **Document creation & editing** — create, rename, and edit documents with a
  browser-based rich-text editor (bold, italic, underline, strikethrough, alignment, 
  H1/H2, bulleted and numbered lists). Changes autosave ~800ms after you stop typing.
- **File upload** — import a `.txt`, `.md`, or `.docx` file as a new,
  editable document. `.docx` formatting is converted via Mammoth; Markdown
  gets a small built-in converter for headings/bold/italic/lists; `.txt` is
  wrapped into paragraphs. Max file size 5MB. Anything else is rejected with
  a clear error, both client- and server-side.
- **Sharing** — every document has one owner. Owners can share with another
  seeded user by email, with "can edit" or "can view" permission. The
  dashboard visually separates **Your documents** from **Shared with you**,
  and a shared document opened in "view" mode disables the editor.
- **Persistence** — SQLite (file-based, via `better-sqlite3`). Documents and
  shares survive a server restart and a page refresh.
- **Tests** — `backend/tests/documents.test.js` covers document creation,
  access control (a non-owner can't open a private doc), the sharing flow,
  authorization on sharing (only the owner can share), and input validation
  (empty titles are rejected). Run with `npm test` in `backend/`.
- **Theme Support** — Full Dark Mode and Light Mode support with smooth transitions.
- **Zen Mode** — Distraction-free full-screen writing canvas.
- **Document Exporter** — Download documents in Text, Markdown, or HTML formats.
- **Statistics** — Live Word Count, Character Count, and Estimated Reading Time indicators.
- **Search, Filter, Sort** — Filter documents by ownership and search/sort dynamically on the dashboard.

## Tech stack

- **Backend:** Node.js, Express, better-sqlite3, Multer (uploads), Mammoth
  (`.docx` → HTML)
- **Frontend:** React 18, React Router, Vite. No UI kit — hand-styled to
  keep the bundle small and the design intentional.
- **Auth:** mocked. There are 3 seeded accounts and a picker screen instead
  of passwords — see "Why mocked auth" in `ARCHITECTURE.md`.

## Project structure

```
scribe/
  backend/          Express API + SQLite
    routes/          auth, documents, upload
    tests/           automated API tests
    db.js            schema + seed data
    server.js        app entrypoint
  frontend/         React (Vite) app
    src/pages/        Login, Dashboard, Editor
    src/components/   ShareModal
    src/styles.css    premium light/dark style sheet
    src/api.js        fetch wrapper
```

## Running locally

Requires Node.js 18+.

### 1. Backend

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:4000
```

The SQLite file is created automatically at `backend/data/scribe.sqlite`
on first run, seeded with 3 demo users (see below).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests
to `http://localhost:4000`, so both must be running.

### Running the tests

```bash
cd backend
npm test
```

## Demo accounts

No password — pick one from the login screen. To test sharing, sign in as
one user, share a document with a second user's email, then switch accounts
(top-right "Switch account") and sign in as that user.

| Name | Email |
|---|---|
| Archana Sekar | archana@example.com |
| Priya Raman | priya@example.com |
| Dev Kumar | dev@example.com |

## Live Deployment

The application is deployed and active:
- **Live Website**: [https://scribe-docs-editor.netlify.app/](https://scribe-docs-editor.netlify.app/)
- **Backend API**: Deployed on Render Web Services (Free Tier)

For step-by-step instructions on persistent volumes, local tunnels, or configuring environment variables, refer to the [Deployment Guide](deploy_guide.md).

## Production build

```bash
cd frontend
npm run build        # outputs static files to frontend/dist
```

Serve `frontend/dist` from any static host and point it at a deployed copy
of `backend/` (set `VITE_BACKEND_URL` at build time, or reverse-proxy `/api`
to the backend in your hosting config). The backend needs a writable disk
for the SQLite file, so a platform like Render, Railway, or Fly.io (rather
   than a fully serverless host) is the simplest fit.

## Known limitations (by design)

- Auth is mocked — no passwords, no sessions, anyone with the app URL can
  act as any seeded user by picking them from the list.
- Sharing is per-document and per-user only — no link sharing, no
  organization-wide access, no owner transfer.
- The rich-text editor covers common formatting, not the full Google Docs
  feature set (no tables, comments, images, or version history).
- No real-time collaboration — two people editing the same document
  concurrently will overwrite each other's autosave (last write wins).
