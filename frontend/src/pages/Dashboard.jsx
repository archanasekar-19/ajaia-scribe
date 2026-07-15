import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App.jsx";
import { api } from "../api.js";
import ShareModal from "../components/ShareModal.jsx";

const ScribeLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
    className="brand-mark-svg"
    viewBox="0 0 36 36"
    style={{ color: "var(--accent)", width: "36px", height: "36px" }}
  >
    <path
      fill="currentColor"
      d="M17 33.9c-3.9 0-7.9-1.5-10.5-4.5c-.9.7-2 1.3-3.1 1.8c-.5.2-1.1 0-1.3-.5s0-1.1.5-1.3q1.5-.6 2.7-1.5c-1.2-1.9-1.9-4.3-1.9-7.1c0-5.3 2.5-8.1 4.8-8.1c1.5 0 3.2 1.2 3.2 4.7c0 4.7-1.1 8.2-3.5 10.8c2.2 2.6 5.6 3.9 9 3.9c.6 0 1 .4 1 1s-.3.8-.9.8M8.2 14.6c-1 0-2.8 1.8-2.8 6.1c0 2.2.5 4.1 1.4 5.6c1.8-2.1 2.7-5.1 2.7-9.1c0-1.5-.5-2.6-1.3-2.6m25.1-9.8c-.8-1.4-2.1-2.4-3.6-2.8c-.5-.1-1.1.2-1.2.7l-.9 3.4L26 3.3c-.1-.2-.4-.4-.7-.5s-.6 0-.8.2c-1.1.8-1.8 1.9-2.2 3.2l-4.2 15.4c-.4 1.5-.2 3.2.6 4.6c.6 1.1 1.6 1.9 2.7 2.5l-1.1 4c-.1.5.2 1.1.7 1.2h.3c.4 0 .8-.3 1-.7l1.1-3.9h.6c1 0 2-.3 3-.8c1.4-.8 2.4-2.1 2.8-3.6l1.6-5.8l1.6-5.8c.1-.4 0-.8-.4-1.1c-.3-.2-.8-.3-1.1-.1l-4 2.3l.6-2.1l5.7-3.2c.3-.2.5-.5.5-.8c-.1-1.2-.4-2.4-1-3.5m-9.1 2c.1-.5.3-.9.6-1.3l1.9 3.4l-1.4 5.1l-2.1-3.7zm-3.8 18.4c-.5-.9-.7-2-.4-3l2.5-9.2l2.1 3.7l-1.4 5.3l-1.3 4.7q-.9-.45-1.5-1.5m7.3-.9c-.3 1-.9 1.9-1.9 2.4c-.6.4-1.3.5-2 .5L25 23l3.7-2.1zm2.6-9.2l-.8 3.1l-3.7 2.1l.8-3.1zm-1.7-5.5l.1-.4c.1-.1.1-.3.1-.4L30 4.3c.6.3 1.1.9 1.5 1.5c.3.6.5 1.2.5 1.8z"
    />
    <path fill="none" d="M0 0h36v36H0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" className="doc-icon-svg" strokeWidth="2.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso.replace(" ", "T") + "Z").getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [sortBy, setSortBy] = useState("updated-desc");
  const [activeMenuDocId, setActiveMenuDocId] = useState(null);

  useEffect(() => {
    const closeMenu = () => setActiveMenuDocId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .listDocuments(currentUser.id)
      .then((res) => {
        setOwned(res.owned);
        setShared(res.shared);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [currentUser.id]);

  const handleCreate = async () => {
    const doc = await api.createDocument(currentUser.id, { title: "Untitled document" });
    navigate(`/documents/${doc.id}`);
  };

  const handleRename = async (doc) => {
    const title = window.prompt("Rename document", doc.title);
    if (!title || title === doc.title) return;
    await api.updateDocument(doc.id, currentUser.id, { title });
    load();
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    await api.deleteDocument(doc.id, currentUser.id);
    load();
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const doc = await api.uploadFile(currentUser.id, formData);
      navigate(`/documents/${doc.id}`);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Search & Sort implementation
  const filterAndSort = (list) => {
    let result = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(q));
    }
    
    return [...result].sort((a, b) => {
      if (sortBy === "updated-desc") {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      if (sortBy === "updated-asc") {
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
  };

  const filteredOwned = filterTab === "shared" ? [] : filterAndSort(owned);
  const filteredShared = filterTab === "owned" ? [] : filterAndSort(shared);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <ScribeLogo />
          <span className="brand-name">Scribe</span>
        </div>
        <div className="top-bar-actions">
          <span className="current-user">Signed in as <strong>{currentUser.name}</strong></span>
          <ThemeToggle />
          <button className="secondary-button" onClick={logout} style={{ padding: "6px 12px" }}>
            Switch account
          </button>
        </div>
      </header>

      <main className="dashboard">
        <div className="dashboard-controls">
          <div className="controls-row-top">
            <div className="search-wrapper">
              <svg viewBox="0 0 24 24" className="search-icon">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sort-wrapper">
              <span className="sort-label">Sort by:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated-desc">Last Edited (Newest)</option>
                <option value="updated-asc">Last Edited (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
          </div>
          <div className="controls-row-bottom">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filterTab === "all" ? "active" : ""}`}
                onClick={() => setFilterTab("all")}
              >
                All Documents
              </button>
              <button
                className={`filter-tab ${filterTab === "owned" ? "active" : ""}`}
                onClick={() => setFilterTab("owned")}
              >
                Owned by Me
              </button>
              <button
                className={`filter-tab ${filterTab === "shared" ? "active" : ""}`}
                onClick={() => setFilterTab("shared")}
              >
                Shared with Me
              </button>
            </div>
            <div className="action-buttons">
              <button className="primary-button" onClick={handleCreate}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New document
              </button>
              <button className="secondary-button" onClick={handleUploadClick} disabled={uploading}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {uploading ? "Importing…" : "Upload file"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.docx"
                hidden
                onChange={handleFileChange}
              />
            </div>
          </div>
          <div style={{ marginTop: "4px" }}>
            <span className="hint">Supported formats: .txt, .md, .docx (max 5MB)</span>
          </div>
        </div>

        {uploadError && <p className="form-error">{uploadError}</p>}
        {error && <p className="form-error">{error}</p>}

        {filterTab !== "shared" && (
          <section style={{ marginBottom: "40px" }}>
            <h2 className="section-title">
              <span>Your documents</span>
              <span className="section-count">{filteredOwned.length}</span>
            </h2>
            {loading ? (
              <p className="muted">Loading documents…</p>
            ) : filteredOwned.length === 0 ? (
              <p className="muted">
                {searchQuery ? "No matching documents found." : "Nothing yet. Create a document or import a file to get started."}
              </p>
            ) : (
              <div className="doc-grid">
                {filteredOwned.map((doc) => (
                  <div className="doc-card" key={doc.id}>
                    <div className="doc-card-preview-area" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <div className="doc-preview-sheet">
                        <div 
                          className="doc-preview-content" 
                          dangerouslySetInnerHTML={{ __html: doc.content || "<p class='empty-doc'>Empty document</p>" }}
                        />
                        <div className="doc-preview-fade" />
                      </div>
                    </div>
                    
                    <div className="doc-card-footer">
                      <div className="doc-card-info" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <span className="doc-title" title={doc.title}>{doc.title}</span>
                        <div className="doc-card-subinfo">
                          <svg viewBox="0 0 36 36" className="doc-scribe-icon" fill="currentColor">
                            <path d="M17 33.9c-3.9 0-7.9-1.5-10.5-4.5c-.9.7-2 1.3-3.1 1.8c-.5.2-1.1 0-1.3-.5s0-1.1.5-1.3q1.5-.6 2.7-1.5c-1.2-1.9-1.9-4.3-1.9-7.1c0-5.3 2.5-8.1 4.8-8.1c1.5 0 3.2 1.2 3.2 4.7c0 4.7-1.1 8.2-3.5 10.8c2.2 2.6 5.6 3.9 9 3.9c.6 0 1 .4 1 1s-.3.8-.9.8M8.2 14.6c-1 0-2.8 1.8-2.8 6.1c0 2.2.5 4.1 1.4 5.6c1.8-2.1 2.7-5.1 2.7-9.1c0-1.5-.5-2.6-1.3-2.6m25.1-9.8c-.8-1.4-2.1-2.4-3.6-2.8c-.5-.1-1.1.2-1.2.7l-.9 3.4L26 3.3c-.1-.2-.4-.4-.7-.5s-.6 0-.8.2c-1.1.8-1.8 1.9-2.2 3.2l-4.2 15.4c-.4 1.5-.2 3.2.6 4.6c.6 1.1 1.6 1.9 2.7 2.5l-1.1 4c-.1.5.2 1.1.7 1.2h.3c.4 0 .8-.3 1-.7l1.1-3.9h.6c1 0 2-.3 3-.8c1.4-.8 2.4-2.1 2.8-3.6l1.6-5.8l1.6-5.8c.1-.4 0-.8-.4-1.1c-.3-.2-.8-.3-1.1-.1l-4 2.3l.6-2.1l5.7-3.2c.3-.2.5-.5.5-.8c-.1-1.2-.4-2.4-1-3.5m-9.1 2c.1-.5.3-.9.6-1.3l1.9 3.4l-1.4 5.1l-2.1-3.7zm-3.8 18.4c-.5-.9-.7-2-.4-3l2.5-9.2l2.1 3.7l-1.4 5.3l-1.3 4.7q-.9-.45-1.5-1.5m7.3-.9c-.3 1-.9 1.9-1.9 2.4c-.6.4-1.3.5-2 .5L25 23l3.7-2.1zm2.6-9.2l-.8 3.1l-3.7 2.1l.8-3.1zm-1.7-5.5l.1-.4c.1-.1.1-.3.1-.4L30 4.3c.6.3 1.1.9 1.5 1.5c.3.6.5 1.2.5 1.8z"/>
                          </svg>
                          <span className="doc-date">Edited {timeAgo(doc.updatedAt)}</span>
                        </div>
                      </div>
                      
                      <div className="doc-menu-wrapper">
                        <button 
                          className="doc-menu-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                          }}
                          title="Document options"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                            <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                          </svg>
                        </button>
                        {activeMenuDocId === doc.id && (
                          <div className="doc-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => { handleRename(doc); setActiveMenuDocId(null); }}>
                              Rename
                            </button>
                            {doc.isOwner && (
                              <button onClick={() => { setShareTarget(doc); setActiveMenuDocId(null); }}>
                                Share
                              </button>
                            )}
                            <button className="danger" onClick={() => { handleDelete(doc); setActiveMenuDocId(null); }}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {filterTab !== "owned" && (
          <section>
            <h2 className="section-title">
              <span>Shared with you</span>
              <span className="section-count">{filteredShared.length}</span>
            </h2>
            {loading ? (
              <p className="muted">Loading documents…</p>
            ) : filteredShared.length === 0 ? (
              <p className="muted">
                {searchQuery ? "No matching shared documents found." : "No one has shared a document with you yet."}
              </p>
            ) : (
              <div className="doc-grid">
                {filteredShared.map((doc) => (
                  <div className="doc-card" key={doc.id}>
                    <div className="doc-card-preview-area" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <div className="doc-preview-sheet">
                        <div 
                          className="doc-preview-content" 
                          dangerouslySetInnerHTML={{ __html: doc.content || "<p class='empty-doc'>Empty document</p>" }}
                        />
                        <div className="doc-preview-fade" />
                      </div>
                    </div>
                    
                    <div className="doc-card-footer">
                      <div className="doc-card-info" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <span className="doc-title" title={doc.title}>{doc.title}</span>
                        <div className="doc-card-subinfo">
                          <svg viewBox="0 0 36 36" className="doc-scribe-icon" fill="currentColor">
                            <path d="M17 33.9c-3.9 0-7.9-1.5-10.5-4.5c-.9.7-2 1.3-3.1 1.8c-.5.2-1.1 0-1.3-.5s0-1.1.5-1.3q1.5-.6 2.7-1.5c-1.2-1.9-1.9-4.3-1.9-7.1c0-5.3 2.5-8.1 4.8-8.1c1.5 0 3.2 1.2 3.2 4.7c0 4.7-1.1 8.2-3.5 10.8c2.2 2.6 5.6 3.9 9 3.9c.6 0 1 .4 1 1s-.3.8-.9.8M8.2 14.6c-1 0-2.8 1.8-2.8 6.1c0 2.2.5 4.1 1.4 5.6c1.8-2.1 2.7-5.1 2.7-9.1c0-1.5-.5-2.6-1.3-2.6m25.1-9.8c-.8-1.4-2.1-2.4-3.6-2.8c-.5-.1-1.1.2-1.2.7l-.9 3.4L26 3.3c-.1-.2-.4-.4-.7-.5s-.6 0-.8.2c-1.1.8-1.8 1.9-2.2 3.2l-4.2 15.4c-.4 1.5-.2 3.2.6 4.6c.6 1.1 1.6 1.9 2.7 2.5l-1.1 4c-.1.5.2 1.1.7 1.2h.3c.4 0 .8-.3 1-.7l1.1-3.9h.6c1 0 2-.3 3-.8c1.4-.8 2.4-2.1 2.8-3.6l1.6-5.8l1.6-5.8c.1-.4 0-.8-.4-1.1c-.3-.2-.8-.3-1.1-.1l-4 2.3l.6-2.1l5.7-3.2c.3-.2.5-.5.5-.8c-.1-1.2-.4-2.4-1-3.5m-9.1 2c.1-.5.3-.9.6-1.3l1.9 3.4l-1.4 5.1l-2.1-3.7zm-3.8 18.4c-.5-.9-.7-2-.4-3l2.5-9.2l2.1 3.7l-1.4 5.3l-1.3 4.7q-.9-.45-1.5-1.5m7.3-.9c-.3 1-.9 1.9-1.9 2.4c-.6.4-1.3.5-2 .5L25 23l3.7-2.1zm2.6-9.2l-.8 3.1l-3.7 2.1l.8-3.1zm-1.7-5.5l.1-.4c.1-.1.1-.3.1-.4L30 4.3c.6.3 1.1.9 1.5 1.5c.3.6.5 1.2.5 1.8z"/>
                          </svg>
                          <span className="doc-date" title={`Owned by ${doc.ownerName}`}>
                            Owned by {doc.ownerName.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                      
                      {doc.permission === "edit" ? (
                        <div className="doc-menu-wrapper">
                          <button 
                            className="doc-menu-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                            }}
                            title="Document options"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                              <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                              <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                              <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                            </svg>
                          </button>
                          {activeMenuDocId === doc.id && (
                            <div className="doc-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => { handleRename(doc); setActiveMenuDocId(null); }}>
                                Rename
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge" style={{ fontSize: "10px", padding: "3px 6px" }}>View</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {shareTarget && <ShareModal doc={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
}
