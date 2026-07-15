import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../App.jsx";

export default function ShareModal({ doc, onClose }) {
  const { currentUser } = useAuth();
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("edit");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadShares = () => {
    api
      .getShares(doc.id, currentUser.id)
      .then((res) => setShares(res.shares))
      .catch((err) => setStatus({ type: "error", message: err.message }));
  };

  useEffect(() => {
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  const handleShare = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await api.shareDocument(doc.id, currentUser.id, { email, permission });
      setStatus({ type: "success", message: res.message });
      setEmail("");
      loadShares();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (userId) => {
    await api.revokeShare(doc.id, userId, currentUser.id);
    loadShares();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share "{doc.title}"</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="share-form" onSubmit={handleShare}>
          <input
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select value={permission} onChange={(e) => setPermission(e.target.value)}>
            <option value="edit">Can edit</option>
            <option value="view">Can view</option>
          </select>
          <button type="submit" className="primary-button" disabled={busy}>
            Share
          </button>
        </form>

        {status && <p className={status.type === "error" ? "form-error" : "form-success"}>{status.message}</p>}

        <div className="share-list">
          <h3>People with access</h3>
          <div className="share-row owner-row">
            <span>{doc.ownerName || "You"} (owner)</span>
          </div>
          {shares.length === 0 && <p className="muted">Not shared with anyone yet.</p>}
          {shares.map((s) => (
            <div className="share-row" key={s.id}>
              <span>
                {s.name} · {s.email} · {s.permission}
              </span>
              <button className="link-button" onClick={() => handleRevoke(s.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <p className="hint">
          Test accounts for sharing: archana@example.com, priya@example.com, dev@example.com
        </p>
      </div>
    </div>
  );
}
