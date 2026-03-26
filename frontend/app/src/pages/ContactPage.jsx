import React, { useState } from "react";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold">Contact</h1>
      <p className="mt-2 text-sm text-slate-300">This demo UI stores no messages. Hook it to your backend email service later.</p>

      <Card className="mt-6 p-5 md:p-7">
        {sent ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">Message sent (demo).</div>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label className="grid gap-2 text-sm text-slate-300">
              <span>Name</span>
              <input className="rounded-xl bg-black/20 px-3 py-2" required />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              <span>Email</span>
              <input className="rounded-xl bg-black/20 px-3 py-2" type="email" required />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              <span>Message</span>
              <textarea className="min-h-[110px] rounded-xl bg-black/20 px-3 py-2" required />
            </label>
            <div className="flex justify-end">
              <Button type="submit">Send</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

