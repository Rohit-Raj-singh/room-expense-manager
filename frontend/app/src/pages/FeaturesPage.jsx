import React from "react";
import Card from "../components/ui/Card.jsx";

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold">Features</h1>
      <p className="mt-2 text-sm text-slate-300">Everything you need for group-based expense tracking.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          ["JWT Auth", "Protected routes for a secure SaaS experience."],
          ["Group Management", "Create groups, add/remove members, delete groups (admin only)."],
          ["Expense CRUD", "Add, edit and delete expenses with strict per-group validation."],
          ["Analytics", "Monthly expense and member-wise spend charts per selected group."],
          ["Realtime Updates", "Socket.io updates only the relevant group dashboard."],
          ["Mobile Responsive UI", "Sidebar + cards + tables that adapt to small screens."]
        ].map(([title, body]) => (
          <Card key={title} className="p-5">
            <div className="text-base font-semibold">{title}</div>
            <div className="mt-2 text-sm text-slate-300">{body}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

