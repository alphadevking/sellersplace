import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { storeConfig } from "@/config/store";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
          <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            {storeConfig.name}
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            >
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-foreground/80 hover:text-foreground"
            >
              View store <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-2">
          <AdminNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
