import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAuthToken } from "../utils/apiClient.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "rem_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rem_user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setAuthToken(token || "");
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  }, [token]);

  const value = useMemo(
    () => ({
      token: token || "",
      user,
      setUser,
      login: ({ token: t, user: u }) => {
        // Ensure axios gets the header immediately (avoid initial unauthenticated requests).
        setAuthToken(t || "");
        setToken(t);
        setUser(u);
        localStorage.setItem("rem_user", JSON.stringify(u));
      },
      logout: () => {
        setAuthToken("");
        setToken("");
        setUser(null);
        localStorage.removeItem("rem_user");
      }
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

