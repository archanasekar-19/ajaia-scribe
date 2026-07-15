// api.js - thin fetch wrapper. Attaches the mocked x-user-id header from
// whatever user is currently "logged in" (see AuthContext in App.jsx).

const BASE = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "") + "/api"
  : "/api";

async function request(path, { method = "GET", body, userId, isForm = false } = {}) {
  const headers = {};
  if (userId) headers["x-user-id"] = String(userId);
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  listUsers: () => request("/auth/users"),
  listDocuments: (userId) => request("/documents", { userId }),
  getDocument: (id, userId) => request(`/documents/${id}`, { userId }),
  createDocument: (userId, payload) => request("/documents", { method: "POST", body: payload, userId }),
  updateDocument: (id, userId, payload) => request(`/documents/${id}`, { method: "PATCH", body: payload, userId }),
  deleteDocument: (id, userId) => request(`/documents/${id}`, { method: "DELETE", userId }),
  getShares: (id, userId) => request(`/documents/${id}/shares`, { userId }),
  shareDocument: (id, userId, payload) => request(`/documents/${id}/share`, { method: "POST", body: payload, userId }),
  revokeShare: (id, targetUserId, userId) =>
    request(`/documents/${id}/share/${targetUserId}`, { method: "DELETE", userId }),
  uploadFile: (userId, formData) => request("/upload", { method: "POST", body: formData, userId, isForm: true }),
};
