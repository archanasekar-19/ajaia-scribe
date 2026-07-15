// server.js
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const uploadRoutes = require("./routes/upload");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/upload", uploadRoutes);

// Central error handler (e.g. multer errors that slip past route-level handling)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`ajaiascribe backend listening on :${PORT}`));
}

module.exports = app;
