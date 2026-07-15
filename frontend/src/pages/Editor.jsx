import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../App.jsx";
import { api } from "../api.js";
import ShareModal from "../components/ShareModal.jsx";

const SAVE_DEBOUNCE_MS = 800;

// Theme Toggle Component
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

// SVG Toolbar Buttons
function ToolbarButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      className="toolbar-button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection focused
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Editor() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const saveTimer = useRef(null);

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [showShare, setShowShare] = useState(false);
  
  // Custom states
  const [fontFamily, setFontFamily] = useState(localStorage.getItem("editor-font") || "serif");
  const [zenMode, setZenMode] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, readTime: 0 });

  // Update statistics
  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.ceil(words / 200); // ~200 WPM reading speed
    setStats({ words, chars, readTime });
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getDocument(id, currentUser.id)
      .then((data) => {
        if (cancelled) return;
        setDoc(data);
        setTitle(data.title);
        if (editorRef.current) {
          editorRef.current.innerHTML = data.content || "<p></p>";
          updateStats();
        }
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const readOnly = doc && doc.permission === "view";

  const scheduleSave = useCallback(
    (patch) => {
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await api.updateDocument(id, currentUser.id, patch);
          setSaveState("saved");
        } catch (err) {
          setSaveState("error");
          setError(err.message);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [id, currentUser.id]
  );

  const handleContentInput = () => {
    if (readOnly) return;
    updateStats();
    scheduleSave({ content: editorRef.current.innerHTML });
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    if (readOnly) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(doc.title);
      return;
    }
    if (trimmed === doc.title) return;
    try {
      await api.updateDocument(id, currentUser.id, { title: trimmed });
      setDoc((d) => ({ ...d, title: trimmed }));
    } catch (err) {
      setError(err.message);
      setTitle(doc.title);
    }
  };

  const exec = (command, value = null) => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleContentInput();
  };

  // Export options
  const handleExport = (format) => {
    if (!doc || !editorRef.current) return;
    let mimeType = "text/plain";
    let extension = "txt";
    let content = "";
    
    if (format === "markdown") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editorRef.current.innerHTML;
      
      let md = tempDiv.innerHTML
        .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<em>(.*?)<\/em>/gi, "*$1*")
        .replace(/<u>(.*?)<\/u>/gi, "$1") // MD doesn't natively support underline
        .replace(/<ul>([\s\S]*?)<\/ul>/gi, (match, p1) => {
          return p1.replace(/<li>(.*?)<\/li>/gi, "- $1\n") + "\n";
        })
        .replace(/<ol>([\s\S]*?)<\/ol>/gi, (match, p1) => {
          let i = 1;
          return p1.replace(/<li>(.*?)<\/li>/gi, () => `${i++}. $1\n`) + "\n";
        })
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/&nbsp;/gi, " ");
        
      content = md.replace(/<[^>]*>/g, ""); // Strip other tags
      mimeType = "text/markdown";
      extension = "md";
    } else if (format === "html") {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.6; }</style></head><body>${editorRef.current.innerHTML}</body></html>`;
      mimeType = "text/html";
      extension = "html";
    } else {
      content = editorRef.current.innerText || "";
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "untitled"}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFontChange = (e) => {
    const f = e.target.value;
    setFontFamily(f);
    localStorage.setItem("editor-font", f);
  };

  if (error && !doc) {
    return (
      <div className="app-shell">
        <div className="editor-error">
          <p>{error}</p>
          <button className="secondary-button" onClick={() => navigate("/")}>
            Back to documents
          </button>
        </div>
      </div>
    );
  }

  if (!doc) return <div className="page-loading">Loading document…</div>;

  return (
    <div className={`app-shell ${zenMode ? "zen-mode" : ""}`}>
      <header className="top-bar">
        <button className="secondary-button" onClick={() => navigate("/")} style={{ padding: "6px 12px" }}>
          ← Documents
        </button>
        <input
          className="title-input"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          disabled={readOnly}
          title={readOnly ? "View only" : "Rename document"}
        />
        <div className="top-bar-actions">
          <div className="save-state-wrapper">
            <span className={`save-status-dot ${readOnly ? "readonly" : saveState}`} />
            <span className="save-state">
              {readOnly ? "View only" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : "Saved"}
            </span>
          </div>
          <ThemeToggle />
          {doc.isOwner && (
            <button className="primary-button" onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
        </div>
      </header>

      {!readOnly && (
        <div className="toolbar">
          <ToolbarButton title="Bold (Ctrl+B)" onClick={() => exec("bold")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Italic (Ctrl+I)" onClick={() => exec("italic")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="4" x2="10" y2="4" />
              <line x1="14" y1="20" x2="5" y2="20" />
              <line x1="15" y1="4" x2="9" y2="20" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Underline (Ctrl+U)" onClick={() => exec("underline")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
              <line x1="4" y1="21" x2="20" y2="21" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => exec("strikeThrough")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 6A5 5 0 0 0 8 9c0 2.2 1.8 3 4 4s4 1.8 4 4a5 5 0 0 1-8 3" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </ToolbarButton>
          
          <span className="toolbar-divider" />
          
          <ToolbarButton title="Heading 1" onClick={() => exec("formatBlock", "H1")}>
            <strong style={{ fontSize: "14px", fontFamily: "var(--font-serif)" }}>H1</strong>
          </ToolbarButton>
          <ToolbarButton title="Heading 2" onClick={() => exec("formatBlock", "H2")}>
            <strong style={{ fontSize: "13px", fontFamily: "var(--font-serif)" }}>H2</strong>
          </ToolbarButton>
          <ToolbarButton title="Paragraph" onClick={() => exec("formatBlock", "P")}>
            <span style={{ fontSize: "15px", fontWeight: "bold" }}>¶</span>
          </ToolbarButton>
          
          <span className="toolbar-divider" />

          <ToolbarButton title="Align Left" onClick={() => exec("justifyLeft")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Align Center" onClick={() => exec("justifyCenter")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="10" x2="6" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="18" y1="18" x2="6" y2="18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Align Right" onClick={() => exec("justifyRight")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="21" y1="10" x2="7" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="7" y2="18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Align Justify" onClick={() => exec("justifyFull")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="21" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="3" y2="18" />
            </svg>
          </ToolbarButton>

          <span className="toolbar-divider" />
          
          <ToolbarButton title="Bulleted list" onClick={() => exec("insertUnorderedList")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
            </svg>
          </ToolbarButton>

          <span className="toolbar-divider" />

          {/* Font Selector */}
          <select
            className="toolbar-select"
            value={fontFamily}
            onChange={handleFontChange}
            title="Switch Editor Font"
          >
            <option value="serif">Literary Serif</option>
            <option value="sans">Clean Sans</option>
          </select>

          {/* Export Select */}
          <select
            className="toolbar-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                handleExport(e.target.value);
                e.target.value = "";
              }
            }}
            title="Export Document"
          >
            <option value="" disabled>Export as...</option>
            <option value="txt">Plain Text (.txt)</option>
            <option value="markdown">Markdown (.md)</option>
            <option value="html">HTML web page (.html)</option>
          </select>

          {/* Zen Mode Button */}
          <button
            className="secondary-button"
            onClick={() => setZenMode(true)}
            style={{ marginLeft: "auto", fontSize: "12px", padding: "5px 10px" }}
            title="Toggle Zen Mode (Distraction Free)"
          >
            Zen Mode
          </button>
        </div>
      )}

      <main className="editor-page">
        <div className="editor-container">
          <div
            ref={editorRef}
            className={`editor-surface font-${fontFamily} ${readOnly ? "read-only" : ""}`}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onInput={handleContentInput}
          />

          {!zenMode && (
            <div className="editor-footer">
              <div className="editor-stats">
                <span className="editor-stat-item">
                  <strong>{stats.words}</strong> words
                </span>
                <span className="editor-stat-item">
                  <strong>{stats.chars}</strong> characters
                </span>
                <span className="editor-stat-item">
                  <strong>{stats.readTime}</strong> min read
                </span>
              </div>
              <div>
                <span>Ajaia Scribe Editor v1.2</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {zenMode && (
        <button className="zen-exit-button" onClick={() => setZenMode(false)}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "4px" }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Exit Zen Mode
        </button>
      )}

      {showShare && <ShareModal doc={doc} onClose={() => setShowShare(false)} />}
    </div>
  );
}
