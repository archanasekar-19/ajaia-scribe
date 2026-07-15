// routes/upload.js
// Product decision: uploading a file creates a brand new editable document
// (rather than a raw attachment) because the assignment's core surface is
// the editor, not a file browser. Supported types are intentionally limited
// and stated in both the UI and the README.

const express = require("express");
const multer = require("multer");
const path = require("path");
const mammoth = require("mammoth");
const db = require("../db");
const { requireUser } = require("../middleware");

const router = express.Router();
router.use(requireUser);

const ALLOWED_EXTENSIONS = new Set([".txt", ".md", ".docx"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`Unsupported file type "${ext}". Allowed: .txt, .md, .docx`));
    }
    cb(null, true);
  },
});

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Very small Markdown -> HTML pass covering headings, bold/italic, and lists.
// This is intentionally minimal - a full Markdown parser is out of scope.
function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const html = [];
  let inList = false;
  for (const rawLine of lines) {
    let line = escapeHtml(rawLine);
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const listItem = line.match(/^[-*]\s+(.*)$/);

    if (listItem) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMd(listItem[1])}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (heading) {
      const level = heading[1].length + 1; // #: h2, ##: h3, ###: h4
      html.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`);
    } else if (line.trim() === "") {
      html.push("<p></p>");
    } else {
      html.push(`<p>${inlineMd(line)}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

function inlineMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// POST /api/upload - multipart form field "file"
router.post("/", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const titleFromFile = path.basename(req.file.originalname, ext).slice(0, 200) || "Imported document";
    let content;

    try {
      if (ext === ".docx") {
        const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
        content = result.value || "<p></p>";
      } else if (ext === ".md") {
        content = markdownToHtml(req.file.buffer.toString("utf-8"));
      } else {
        // .txt: wrap each non-empty line in a paragraph
        const text = req.file.buffer.toString("utf-8");
        content = text
          .split(/\r?\n/)
          .map((line) => `<p>${escapeHtml(line) || ""}</p>`)
          .join("\n");
      }
    } catch (conversionError) {
      return res.status(422).json({ error: `Could not convert file: ${conversionError.message}` });
    }

    const info = db
      .prepare("INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)")
      .run(titleFromFile, content, req.user.id);

    const doc = db
      .prepare(
        `SELECT d.*, u.name AS owner_name FROM documents d
         JOIN users u ON u.id = d.owner_id WHERE d.id = ?`
      )
      .get(info.lastInsertRowid);

    res.status(201).json({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      ownerId: doc.owner_id,
      isOwner: true,
      permission: "owner",
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    });
  });
});

module.exports = router;
