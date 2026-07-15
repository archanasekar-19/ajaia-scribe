# Submission checklist

## What's included in this folder

- [x] Source code — `backend/` (Express + SQLite API) and `frontend/`
      (React + Vite app)
- [x] `README.md` — local setup and run instructions, demo accounts
- [x] `ARCHITECTURE.md` — priorities, tradeoffs, what's deliberately out of
      scope, what's next
- [x] `AI_WORKFLOW.md` — how AI was used to build this, what was verified,
      what was changed or rejected
- [x] Automated test suite — `backend/tests/documents.test.js` (6 tests,
      all passing as of this build; run `npm test` in `backend/` to verify)

## What's working end to end (verified locally)

- Create, rename, and edit documents with rich-text formatting
  (bold/italic/underline, H1/H2, bulleted/numbered lists), autosaved
- Upload `.txt`, `.md`, or `.docx` and land in a new editable document with
  content converted, not just stored as a blob
- Share a document with another seeded user by email, with edit/view
  permission; the dashboard distinguishes owned vs. shared documents;
  view-only recipients get a read-only editor
- Data persists across refreshes and server restarts (SQLite)
- Server-side access control (verified by tests, not just hidden UI):
  non-owners can't open, edit, or share a document they haven't been given
  access to

## Live Deployment

- **Live Product URL**: [https://scribe-docs-editor.netlify.app/](https://scribe-docs-editor.netlify.app/)
- **Backend API URL**: Deployed on Render's Web Service (Free Tier)

## Outstanding — needs action from the candidate before final submission

These require accounts/services outside this build environment and were
intentionally left for the candidate to complete:
- [ ] **Walkthrough video (3–5 min).** Not recorded. Suggested outline:
      demo flow → creating a doc → uploading a `.docx`/`.md` → sharing with
      a second seeded account and switching to it → what was deprioritized
      (see `ARCHITECTURE.md`) → AI workflow summary (see `AI_WORKFLOW.md`).
- [ ] **Video URL text file** — add once the video is recorded and hosted.
- [ ] **Screenshots/demo GIF** — optional per the brief since setup has no
      extra steps beyond `npm install && npm run dev` in two terminals, but
      easy to add alongside the video.

## What's incomplete or deliberately out of scope

See "Known limitations" in `README.md` and "What I deliberately did not
build" in `ARCHITECTURE.md`: no real authentication (mocked, seeded
users), no real-time collaboration, no permissions beyond edit/view, no
tables/images/comments in the editor.
