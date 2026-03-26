import React from "react";
import Card from "../components/ui/Card.jsx";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold">About</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="text-base font-semibold">Built for multiple groups</div>
          <p className="mt-2 text-sm text-slate-300">
            Splitwise-style expense tracking, but with strict isolation: each group has its own expense history and charts.
          </p>
        </Card>
        <Card className="p-5">
          <div className="text-base font-semibold">Realtime dashboards</div>
          <p className="mt-2 text-sm text-slate-300">
            Socket.io pushes updates to only the group room affected by the latest expense activity.
          </p>
        </Card>
      </div>
    </div>
  );
}

