import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Gate for admin pages and mutations. Redirects anonymous users to login
 * and plain customers back to the storefront. STAFF get read/manage access
 * alongside ADMIN.
 */
export async function requireAdmin(callbackUrl = "/admin") {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    redirect("/");
  }
  return session;
}

/** Non-redirecting variant for API routes — returns the session or null. */
export async function getAdminSession() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") return null;
  return session;
}
