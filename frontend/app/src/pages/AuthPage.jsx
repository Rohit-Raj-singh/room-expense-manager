import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { login, register } from "../api/endpoints.js";
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

export default function AuthPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ mobile: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", mobile: "", password: "" });

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

  async function onRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(regForm);
      setError("Account created. Please login.");
      setRegForm({ name: "", mobile: "", password: "" });
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
          <h1 className="text-xl font-bold">Room Expense Manager</h1>
          <p className="text-sm text-slate-300">
            Login with mobile number, track group expenses in real-time.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-base font-semibold">Login</h2>
            <form className="mt-4 grid gap-3" onSubmit={onLogin}>
              <Field label="Mobile Number">
                <input
                  className="rounded-xl bg-black/20"
                  inputMode="numeric"
                  placeholder="10-15 digits"
                  value={loginForm.mobile}
                  onChange={(e) => setLoginForm((s) => ({ ...s, mobile: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Password">
                <input
                  className="rounded-xl bg-black/20"
                  type="password"
                  placeholder="Your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((s) => ({ ...s, password: e.target.value }))}
                  required
                />
              </Field>
              <Button disabled={loading} type="submit">
                {loading ? "Please wait..." : "Login"}
              </Button>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold">Register</h2>
            <form className="mt-4 grid gap-3" onSubmit={onRegister}>
              <Field label="Name">
                <input
                  className="rounded-xl bg-black/20"
                  placeholder="Your name"
                  value={regForm.name}
                  onChange={(e) => setRegForm((s) => ({ ...s, name: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Mobile Number">
                <input
                  className="rounded-xl bg-black/20"
                  inputMode="numeric"
                  placeholder="10-15 digits"
                  value={regForm.mobile}
                  onChange={(e) => setRegForm((s) => ({ ...s, mobile: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Password">
                <input
                  className="rounded-xl bg-black/20"
                  type="password"
                  placeholder="At least 6 characters"
                  value={regForm.password}
                  onChange={(e) => setRegForm((s) => ({ ...s, password: e.target.value }))}
                  required
                />
              </Field>
              <Button variant="secondary" disabled={loading} type="submit">
                {loading ? "Please wait..." : "Create Account"}
              </Button>
            </form>
          </Card>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

