// tests/documents.test.js
// Run with: npm test (uses Node's built-in test runner, no extra dev deps).
// Uses a throwaway SQLite file so it never touches real data.

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

// Point the app at an isolated test database before requiring anything else.
const TEST_DB_DIR = path.join(__dirname, "..", "data-test");
process.env.SCRIBE_DATA_DIR = TEST_DB_DIR;
if (fs.existsSync(TEST_DB_DIR)) fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });

const request = require("http");
const app = require("../server");

let server;
let baseUrl;

function jsonRequest(method, urlPath, { body, userId } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = request.request(
      baseUrl + urlPath,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(userId ? { "x-user-id": String(userId) } : {}),
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let chunks = "";
        res.on("data", (c) => (chunks += c));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = chunks ? JSON.parse(chunks) : null;
          } catch {
            parsed = chunks;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("rejects requests without a user header", async () => {
  const res = await jsonRequest("GET", "/api/documents");
  assert.equal(res.status, 401);
});

test("a user can create a document and it appears in their owned list", async () => {
  const create = await jsonRequest("POST", "/api/documents", {
    userId: 1,
    body: { title: "Q3 Planning", content: "<p>Draft</p>" },
  });
  assert.equal(create.status, 201);
  assert.equal(create.body.title, "Q3 Planning");
  assert.equal(create.body.isOwner, true);

  const list = await jsonRequest("GET", "/api/documents", { userId: 1 });
  assert.equal(list.status, 200);
  assert.ok(list.body.owned.some((d) => d.id === create.body.id));
});

test("a document is not visible to a user it has not been shared with", async () => {
  const create = await jsonRequest("POST", "/api/documents", {
    userId: 1,
    body: { title: "Private doc" },
  });

  const asOtherUser = await jsonRequest("GET", `/api/documents/${create.body.id}`, { userId: 2 });
  assert.equal(asOtherUser.status, 403);
});

test("owner can share a document by email, and the recipient gains access", async () => {
  const create = await jsonRequest("POST", "/api/documents", {
    userId: 1,
    body: { title: "Shared roadmap" },
  });

  const share = await jsonRequest("POST", `/api/documents/${create.body.id}/share`, {
    userId: 1,
    body: { email: "priya@example.com", permission: "edit" },
  });
  assert.equal(share.status, 201);

  const list = await jsonRequest("GET", "/api/documents", { userId: 2 });
  assert.ok(list.body.shared.some((d) => d.id === create.body.id));
});

test("a non-owner cannot share a document", async () => {
  const create = await jsonRequest("POST", "/api/documents", {
    userId: 1,
    body: { title: "Owner only" },
  });
  await jsonRequest("POST", `/api/documents/${create.body.id}/share`, {
    userId: 1,
    body: { email: "priya@example.com" },
  });

  const attempt = await jsonRequest("POST", `/api/documents/${create.body.id}/share`, {
    userId: 2,
    body: { email: "dev@example.com" },
  });
  assert.equal(attempt.status, 403);
});

test("renaming a document rejects an empty title", async () => {
  const create = await jsonRequest("POST", "/api/documents", { userId: 1, body: { title: "Rename me" } });
  const rename = await jsonRequest("PATCH", `/api/documents/${create.body.id}`, {
    userId: 1,
    body: { title: "   " },
  });
  assert.equal(rename.status, 400);
});
