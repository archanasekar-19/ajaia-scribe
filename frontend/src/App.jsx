import React, { createContext, useContext, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";
import { api } from "./api.js";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = "ajaiascribe.currentUserId";

function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listUsers()
      .then(({ users }) => {
        setUsers(users);
        const savedId = Number(localStorage.getItem(STORAGE_KEY));
        const restored = users.find((u) => u.id === savedId);
        if (restored) setCurrentUser(restored);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY, String(user.id));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ users, currentUser, login, logout, loading }}>{children}</AuthContext.Provider>
  );
}

function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <RequireAuth>
            <Editor />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
