import React from "react";
import { cn } from "../../utils/helpers";

export function Card({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-slate-700/60 bg-slate-900/80 shadow-[0_12px_40px_rgba(2,6,23,0.35)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Message({ message }) {
  if (!message) return null;

  const styles = {
    success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    error: "border-rose-400/20 bg-rose-500/10 text-rose-200",
    info: "border-blue-400/20 bg-blue-500/10 text-blue-200",
  };

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border px-4 py-3 text-sm",
        styles[message.type] || styles.info
      )}
    >
      {message.text}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="text-sm uppercase tracking-[0.24em] text-blue-400">{eyebrow}</div>
        <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
