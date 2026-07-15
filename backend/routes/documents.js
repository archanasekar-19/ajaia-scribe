// routes/documents.js
// Core document CRUD + sharing logic.

const express = require("express");
const db = require("../db");
const { requireUser } = require("../middleware");

const router = express.Router();
router.use(requireUser);

function serializeDocument(doc, currentUserId) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    ownerId: doc.owner_id,
    ownerName: doc.owner_name,
    isOwner: doc.owner_id === currentUserId,
    permission: doc.owner_id === currentUserId ? "owner" : doc.permission || "edit",
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

// GET /api/documents - list documents the current user owns or has been shared
router.get("/", (req, res) => {
  const userId = req.user.id;

  const owned = db
    .prepare(
      `SELECT d.*, u.name AS owner_name
       FROM documents d JOIN users u ON u.id = d.owner_id
       WHERE d.owner_id = ?
       ORDER BY d.updated_at DESC`
    )
    .all(userId);

  const shared = db
    .prepare(
      `SELECT d.*, u.name AS owner_name, s.permission AS permission
       FROM document_shares s
       JOIN documents d ON d.id = s.document_id
       JOIN users u ON u.id = d.owner_id
       WHERE s.user_id = ?
       ORDER BY d.updated_at DESC`
    )
    .all(userId);

  res.json({
    owned: owned.map((d) => serializeDocument(d, userId)),
    shared: shared.map((d) => serializeDocument(d, userId)),
  });
});

// Helper: fetch a document and confirm the current user may access it.
// Returns { doc, role } or sends a response and returns null.
function loadAccessibleDoc(req, res, { requireEdit = false } = {}) {
  const docId = Number(req.params.id);
  const userId = req.user.id;

  const doc = db
    .prepare(
      `SELECT d.*, u.name AS owner_name FROM documents d
       JOIN users u ON u.id = d.owner_id WHERE d.id = ?`
    )
    .get(docId);

  if (!doc) {
    res.status(404).json({ error: "Document not found." });
    return null;
  }

  if (doc.owner_id === userId) return { doc, role: "owner" };

  const share = db
    .prepare("SELECT permission FROM document_shares WHERE document_id = ? AND user_id = ?")
    .get(docId, userId);

  if (!share) {
    res.status(403).json({ error: "You do not have access to this document." });
    return null;
  }

  if (requireEdit && share.permission !== "edit") {
    res.status(403).json({ error: "You only have view access to this document." });
    return null;
  }

  doc.permission = share.permission;
  return { doc, role: share.permission };
}

// GET /api/documents/:id
router.get("/:id", (req, res) => {
  const result = loadAccessibleDoc(req, res);
  if (!result) return;
  res.json(serializeDocument(result.doc, req.user.id));
});

// POST /api/documents - create a new blank document
router.post("/", (req, res) => {
  const title = (req.body.title || "Untitled document").toString().slice(0, 200).trim() || "Untitled document";
  const content = typeof req.body.content === "string" ? req.body.content : "";

  const info = db
    .prepare("INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)")
    .run(title, content, req.user.id);

  const doc = db
    .prepare(
      `SELECT d.*, u.name AS owner_name FROM documents d
       JOIN users u ON u.id = d.owner_id WHERE d.id = ?`
    )
    .get(info.lastInsertRowid);

  res.status(201).json(serializeDocument(doc, req.user.id));
});

// PATCH /api/documents/:id - rename and/or update content
router.patch("/:id", (req, res) => {
  const result = loadAccessibleDoc(req, res, { requireEdit: true });
  if (!result) return;

  const { title, content } = req.body;

  if (title !== undefined) {
    const trimmed = title.toString().slice(0, 200).trim();
    if (!trimmed) {
      return res.status(400).json({ error: "Title cannot be empty." });
    }
    db.prepare("UPDATE documents SET title = ?, updated_at = datetime('now') WHERE id = ?").run(
      trimmed,
      result.doc.id
    );
  }

  if (content !== undefined) {
    if (typeof content !== "string") {
      return res.status(400).json({ error: "Content must be a string of HTML." });
    }
    db.prepare("UPDATE documents SET content = ?, updated_at = datetime('now') WHERE id = ?").run(
      content,
      result.doc.id
    );
  }

  const updated = db
    .prepare(
      `SELECT d.*, u.name AS owner_name FROM documents d
       JOIN users u ON u.id = d.owner_id WHERE d.id = ?`
    )
    .get(result.doc.id);

  res.json(serializeDocument(updated, req.user.id));
});

// DELETE /api/documents/:id - owner only
router.delete("/:id", (req, res) => {
  const result = loadAccessibleDoc(req, res);
  if (!result) return;
  if (result.role !== "owner") {
    return res.status(403).json({ error: "Only the owner can delete this document." });
  }
  db.prepare("DELETE FROM documents WHERE id = ?").run(result.doc.id);
  res.status(204).end();
});

// GET /api/documents/:id/shares - list who a document is shared with (owner only)
router.get("/:id/shares", (req, res) => {
  const result = loadAccessibleDoc(req, res);
  if (!result) return;
  if (result.role !== "owner") {
    return res.status(403).json({ error: "Only the owner can view sharing settings." });
  }
  const shares = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.permission FROM document_shares s
       JOIN users u ON u.id = s.user_id WHERE s.document_id = ?`
    )
    .all(result.doc.id);
  res.json({ shares });
});

// POST /api/documents/:id/share - owner shares with another user by email
router.post("/:id/share", (req, res) => {
  const result = loadAccessibleDoc(req, res);
  if (!result) return;
  if (result.role !== "owner") {
    return res.status(403).json({ error: "Only the owner can share this document." });
  }

  const email = (req.body.email || "").toString().trim().toLowerCase();
  const permission = req.body.permission === "view" ? "view" : "edit";

  if (!email) {
    return res.status(400).json({ error: "An email address is required." });
  }

  const targetUser = db.prepare("SELECT * FROM users WHERE lower(email) = ?").get(email);
  if (!targetUser) {
    return res.status(404).json({ error: `No user found with email ${email}.` });
  }
  if (targetUser.id === req.user.id) {
    return res.status(400).json({ error: "You already own this document." });
  }

  db.prepare(
    `INSERT INTO document_shares (document_id, user_id, permission) VALUES (?, ?, ?)
     ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission`
  ).run(result.doc.id, targetUser.id, permission);

  res.status(201).json({ message: `Shared with ${targetUser.name}.`, userId: targetUser.id, permission });
});

// DELETE /api/documents/:id/share/:userId - owner revokes access
router.delete("/:id/share/:userId", (req, res) => {
  const result = loadAccessibleDoc(req, res);
  if (!result) return;
  if (result.role !== "owner") {
    return res.status(403).json({ error: "Only the owner can modify sharing." });
  }
  db.prepare("DELETE FROM document_shares WHERE document_id = ? AND user_id = ?").run(
    result.doc.id,
    Number(req.params.userId)
  );
  res.status(204).end();
});

module.exports = router;
