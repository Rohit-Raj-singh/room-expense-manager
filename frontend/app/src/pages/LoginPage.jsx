import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { login } from "../api/endpoints.js";
import { useAuth } from "../state/AuthContext.jsx";
import { getApiErrorMessage } from "../utils/apiClient.js";

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function LoginPage() {
  const nav = useNavigate();
  const auth = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ mobileNumber: "", password: "" });

  async function onLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(loginForm);
      auth.login(data);
      nav("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Card className="p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">Login</h1>
          <p className="text-sm text-slate-300">Sign in to manage your groups and expenses.</p>
        </div>

        <form className="mt-6 grid gap-3 md:grid-cols-1" onSubmit={onLogin}>
          <Field label="Mobile Number">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              inputMode="numeric"
              placeholder="10-15 digits"
              value={loginForm.mobileNumber}
              onChange={(e) => setLoginForm((s) => ({ ...s, mobileNumber: e.target.value }))}
              required
            />
          </Field>
          <Field label="Password">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              type="password"
              placeholder="Your password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
              required
            />
          </Field>

          {error ? <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </Button>

          <div className="text-sm text-slate-300">
            No account?{" "}
            <a className="text-indigo-300 underline" href="/register">
              Register
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}

