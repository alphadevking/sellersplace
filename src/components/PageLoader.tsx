import { Loader2 } from "lucide-react";

/**
 * Full-height loading state shown in place of a route segment while its
 * Server Components fetch data (via the framework's loading.tsx convention),
 * so navigation feels instant instead of frozen.
 */
export default function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3">
      <span className="relative flex h-11 w-11 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-20"
          style={{ background: "var(--brand)" }}
        />
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--brand)" }} />
      </span>
      {label && <span className="text-sm text-muted">{label}</span>}
    </div>
  );
}
