import React from "react";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold leading-tight">
            Multi-Group Expense Management, like Splitwise
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Create multiple groups, track independent histories, and update everyone instantly with real-time Socket.io.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login">
              <Button>Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary">Register</Button>
            </Link>
          </div>
        </div>

        <Card className="w-full max-w-md p-6 md:p-7">
          <h2 className="text-base font-semibold">Why you’ll like it</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-200">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">Per-group expense isolation</div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">Admin-managed members</div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">Analytics with charts</div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">Realtime updates per group</div>
          </div>
        </Card>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { title: "Groups", body: "One admin creates many groups. Members can join multiple groups." },
          { title: "Isolation", body: "Expenses are strictly filtered by `groupId`, so nothing crosses groups." },
          { title: "Realtime", body: "Add/edit/delete expenses and dashboards update instantly." }
        ].map((f) => (
          <Card key={f.title} className="p-5">
            <div className="text-base font-semibold">{f.title}</div>
            <div className="mt-2 text-sm text-slate-300">{f.body}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

