"use client";

import { Loader2 } from "lucide-react";

/** Full-screen blocking overlay for in-flight submissions (payment redirects, sign-in, saves). */
export default function LoadingOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
      style={{ background: "color-mix(in srgb, var(--background) 75%, transparent)" }}
    >
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-20"
          style={{ background: "var(--brand)" }}
        />
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--brand)" }} />
      </span>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
    </div>
  );
}
