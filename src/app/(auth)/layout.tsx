import Link from "next/link";
import { storeConfig } from "@/config/store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <Link href="/" className="mb-8 text-lg font-semibold tracking-tight">
        {storeConfig.name}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
