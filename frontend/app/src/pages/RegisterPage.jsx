import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { register } from "../api/endpoints.js";
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

export default function RegisterPage() {
  const nav = useNavigate();
  const auth = useAuth();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", mobileNumber: "", password: "" });

  async function onRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(regForm);
      setRegForm({ name: "", mobileNumber: "", password: "" });
      nav("/login");
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
          <h1 className="text-xl font-bold">Register</h1>
          <p className="text-sm text-slate-300">Create an account using your mobile number.</p>
        </div>

        <form className="mt-6 grid gap-3" onSubmit={onRegister}>
          <Field label="Name">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              placeholder="Your name"
              value={regForm.name}
              onChange={(e) => setRegForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </Field>

          <Field label="Mobile Number">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              inputMode="numeric"
              placeholder="10-15 digits"
              value={regForm.mobileNumber}
              onChange={(e) => setRegForm((s) => ({ ...s, mobileNumber: e.target.value }))}
              required
            />
          </Field>

          <Field label="Password">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              type="password"
              placeholder="At least 6 characters"
              value={regForm.password}
              onChange={(e) => setRegForm((s) => ({ ...s, password: e.target.value }))}
              required
            />
          </Field>

          {error ? <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Create Account"}
          </Button>

          <div className="text-sm text-slate-300">
            Already have an account?{" "}
            <a className="text-indigo-300 underline" href="/login">
              Login
            </a>
          </div>
        </form>
      </Card>
    </div>
  );
}

