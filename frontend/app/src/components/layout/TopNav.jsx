import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../ui/Button.jsx";
import { useAuth } from "../../state/AuthContext.jsx";

export default function TopNav() {
  const auth = useAuth();
  const nav = useNavigate();

  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-bold text-slate-100">
            Room Expense Manager
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link className="text-sm text-slate-300 hover:text-slate-100" to="/features">
              Features
            </Link>
            <Link className="text-sm text-slate-300 hover:text-slate-100" to="/about">
              About
            </Link>
            <Link className="text-sm text-slate-300 hover:text-slate-100" to="/contact">
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {auth.token ? (
            <>
              <Link to="/dashboard">
                <Button size="sm" variant="ghost">
                  Dashboard
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  auth.logout();
                  nav("/login");
                }}
                type="button"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button size="sm" variant="ghost">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

