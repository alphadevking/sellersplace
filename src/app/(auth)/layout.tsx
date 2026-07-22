import Link from "next/link";
import { storeConfig } from "@/config/store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <Link
        href="/"
        className="mb-8 font-display text-2xl font-semibold tracking-[-0.02em]"
      >
        {storeConfig.name}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <Link
        href="/"
        className="mt-6 text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Back to store
      </Link>
    </div>
  );
}
