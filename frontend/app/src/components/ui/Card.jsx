import React from "react";

export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/5 shadow-soft backdrop-blur",
        className
      ].join(" ")}
    >
      {children}
    </div>
  );
}

