# AI workflow note

## Which AI tools I used

Claude (Anthropic), working directly in a sandboxed dev environment with
file editing, a shell, and the ability to run/test code — used for the
majority of the implementation: scaffolding the Express API, the SQLite
schema, the React frontend, styling, and the test suite, plus drafting this
set of docs.

## Where AI materially sped up the work

- **Boilerplate and wiring.** Express route scaffolding, the SQLite schema,
  Vite/React project setup, and CORS/proxy configuration are all
  well-understood patterns where AI generation is fast and low-risk. This
  is exactly the kind of work that shouldn't eat timebox hours by hand.
- **The Markdown → HTML converter for `.md` uploads.** Rather than pulling
  in a full Markdown library for a deliberately small feature set
  (headings, bold/italic, lists), I had Claude write a small purpose-built
  converter, which kept the dependency footprint down.
- **Test scaffolding.** Writing the HTTP test harness (a small wrapper
  around Node's built-in `http` + `node:test`, avoiding an extra
  supertest/jest dependency) and the initial set of test cases was faster
  with AI drafting a first pass that I then reviewed for coverage gaps.
- **First-pass visual design.** Getting a coherent type scale, color
  palette, and component styling to a "usable and coherent" bar quickly,
  rather than shipping unstyled HTML and running out of time before
  touching CSS.

## What AI-generated output I changed or rejected

- **Multer version.** The first dependency pass pulled in Multer 1.x,
  which npm flags as having known vulnerabilities. I rejected it and
  pinned Multer 2.x instead, then re-verified the upload flow still worked
  against the new API.
- **Test isolation.** An early version of the test file referenced a
  database path that `db.js` didn't actually respect, which would have
  made "isolated" tests silently share state with local dev data. I fixed
  `db.js` to honor a `AJAIASCRIBE_DATA_DIR` override and removed the dead code
  path once it was actually isolated.
- **`npm test` script.** The initial `node --test tests/` invocation
  doesn't reliably discover test files in this Node version — I caught
  this by actually running it (it failed with `MODULE_NOT_FOUND`), not by
  inspecting the script, and fixed the script to run `node --test tests/documents.test.js`.
- **Editing library choice.** I considered pulling in a rich-text editor
  package but decided against it for this scope (see `ARCHITECTURE.md`) —
  an example of steering away from an AI-suggested dependency add rather
  than accepting the "just add a library" default.

## How I verified correctness, UX quality, and implementation reliability

- **Ran the automated test suite** (`npm test` in `backend/`) after every
  meaningful backend change — all 6 tests pass, covering the access-control
  paths that matter most (see `ARCHITECTURE.md` for why sharing got the
  most scrutiny).
- **Manually exercised the API with curl** end-to-end before building the
  UI on top of it: created a document, shared it, confirmed the second
  user sees it in "shared," and uploaded a `.md` file to confirm the
  conversion output looked right — rather than assuming the route code was
  correct from reading it.
- **Ran a full production build** of the frontend (`npm run build`) to
  catch any build-time errors before considering the frontend done.
- **Started both servers together and hit the dev proxy directly** to
  confirm the frontend's `/api` calls actually reach the backend, instead
  of trusting the Vite config in isolation.
