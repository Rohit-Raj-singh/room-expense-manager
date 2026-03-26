import React from "react";

const variants = {
  primary:
    "bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white",
  secondary:
    "bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white",
  ghost: "bg-transparent border border-white/15 hover:bg-white/5 text-slate-100"
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const sizes = {
    sm: "px-3 py-2 text-sm rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-4 py-3 text-base rounded-xl"
  };

  return (
    <button
      className={[
        "font-semibold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      ].join(" ")}
      {...props}
    />
  );
}

