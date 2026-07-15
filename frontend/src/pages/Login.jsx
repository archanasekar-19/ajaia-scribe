import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../App.jsx";

const QuillLogo = () => (
  <svg
    viewBox="0 0 64 64"
    className="brand-mark-svg"
    strokeWidth="4.5"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ color: "var(--accent)", width: "36px", height: "36px" }}
  >
    {/* Left loop leaf */}
    <path d="M12 46c-7 0-5-16 1-20c6-4 10 10 2 10c-6 0-8 12 10 14" />
    
    {/* Right sprig stem */}
    <path d="M38 50c1-8 4-18 5-26" />
    
    {/* Top lobe */}
    <path d="M43 24c-2-8 6-8 6 0c0 4-4 6-6 6" />
    
    {/* Left lobes */}
    <path d="M42 30c-6-4-6 4 0 6" />
    <path d="M41 38c-6-4-6 4 0 6" />
    <path d="M40 46c-6-4-6 4 0 6" />
    
    {/* Right lobes */}
    <path d="M43 27c6-4 6 4 0 6" />
    <path d="M42 35c6-4 6 4 0 6" />
    <path d="M41 43c6-4 6 4 0 6" />
  </svg>
);

export default function Login() {
  const { users, currentUser, login, loading } = useAuth();

  if (currentUser) return <Navigate to="/" replace />;

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand">
          <QuillLogo />
          <span className="brand-name">Ajaia Scribe</span>
        </div>
        <h1>Pick a workspace account</h1>
        <p className="muted">
          This workspace uses seeded accounts instead of passwords, allowing you to test document sharing between team members. Pick who you're signing in as.
        </p>

        {loading && <p className="muted">Loading accounts…</p>}

        <div className="user-list">
          {users.map((u) => (
            <button key={u.id} className="user-option" onClick={() => login(u)}>
              <span className="avatar">{u.name.charAt(0)}</span>
              <span className="user-info">
                <span className="user-name">{u.name}</span>
                <span className="user-email">{u.email}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
