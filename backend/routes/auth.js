// routes/auth.js
// Mocked auth: no passwords. The frontend lets the reviewer pick one of the
// seeded users, and every subsequent request carries that user's id in the
// `x-user-id` header. This is clearly documented as a scope cut, not a real
// auth system.

const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/auth/users - list the seeded accounts for the "login" picker
router.get("/users", (req, res) => {
  const users = db.prepare("SELECT id, name, email FROM users ORDER BY id").all();
  res.json({ users });
});

module.exports = router;
