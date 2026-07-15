// middleware.js
const db = require("./db");

// Reads x-user-id from the request, validates it against the seeded users
// table, and attaches req.user. Every protected route uses this instead of
// real session/token auth (see AI_WORKFLOW.md for why this was cut).
function requireUser(req, res, next) {
  const userId = Number(req.header("x-user-id"));
  if (!userId) {
    return res.status(401).json({ error: "Missing x-user-id header. Select a user to continue." });
  }
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(userId);
  if (!user) {
    return res.status(401).json({ error: "Unknown user id." });
  }
  req.user = user;
  next();
}

module.exports = { requireUser };
