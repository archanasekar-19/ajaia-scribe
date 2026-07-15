# Architecture note

## What I prioritized

Given the 4–6 hour box, I ranked the four core surfaces (editing, upload,
sharing, persistence) by how much they'd expose real product and
engineering judgment, and spent time in this order:

1. **Sharing + access control.** This is where "demonstrate clear intent
   and working logic" actually gets tested — it's easy to fake a share
   button that doesn't enforce anything. I made sure every document route
   checks ownership/share status server-side (`loadAccessibleDoc` in
   `routes/documents.js`), not just client-side hiding, and covered the
   important negative cases in tests (non-owner can't share, non-shared
   user can't read).
2. **A coherent editing flow**, not a feature-complete one. Bold/italic/
   underline/headings/lists cover the formatting people actually reach for
   in a lightweight doc tool. I used `contentEditable` +
   `document.execCommand` rather than pulling in a WYSIWYG library —
   `execCommand` is deprecated but still broadly supported in Chromium/
   Firefox, and for this scope it avoids ~200KB of editor-library weight
   and version-compat risk for a feature set this small. If this were
   going into a real product I'd swap it for a maintained framework
   (Tiptap/ProseMirror or Lexical) before it grew any further, since
   `execCommand` behavior isn't standardized and gets harder to control
   as formatting needs grow.
3. **File upload that's actually useful, not just a file picker.**
   Uploading converts the file straight into an editable document rather
   than storing an opaque attachment, because the more valuable product
   behavior is "get my content into the editor," not "store a blob." I
   limited supported types to `.txt`/`.md`/`.docx` and reject everything
   else with a specific error, both so the scope stays bounded and so a
   reviewer immediately understands the boundary.
4. **Persistence.** SQLite via `better-sqlite3` — synchronous, zero
   external service to stand up, and one file to hand a reviewer. For a
   real multi-instance deployment I'd move to Postgres (the schema is
   already normalized in a way that ports directly).

## What I deliberately did not build

- **Real auth.** A password/session system is a well-understood problem
  that wouldn't tell you much about my product judgment in this exercise,
  and it would have eaten a third of the timebox. I mocked it with a
  seeded-user picker and documented that clearly rather than pretending
  it's more secure than it is.
- **Real-time collaboration.** The prompt explicitly lists this as
  optional stretch work; building it well (operational transforms or CRDTs)
  is a multi-day problem on its own, and a half-built version would be
  worse than an honest "not built."
- **Granular permissions beyond edit/view.** I added two tiers because the
  data model made it nearly free, but role hierarchies (commenter, admin,
  etc.) would be scope creep for this exercise.
- **Attachments separate from documents.** I considered supporting
  "upload a file and attach it to an existing document" in addition to
  "upload a file as a new document," but that's two upload UX patterns for
  one exercise; I picked the one with a clearer product payoff.

## Data model

```
users            (id, name, email)
documents        (id, title, content, owner_id, created_at, updated_at)
document_shares  (id, document_id, user_id, permission)   -- permission: edit | view
```

`content` stores the editor's HTML directly. That's simple and preserves
formatting exactly as authored; the tradeoff is that it's not a portable
document format (no versioning, no diffing, no plain-text export yet).

## What I'd build next with another 2–4 hours

1. Swap `execCommand` for a small maintained rich-text framework (Tiptap)
   to get more reliable formatting behavior and room to grow (tables,
   images).
2. Optimistic UI + conflict warning on the editor (detect if the document
   changed since it was loaded, before overwriting on save).
3. Markdown/PDF export, since the data is already HTML and it's a natural
   stretch from the import path.
4. A real auth layer (even a simple email+magic-link flow) so the sharing
   model isn't trivially bypassable.
