"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserAccount, getDeletionBlockers } from "@/lib/user-deletion";

/**
 * Self-serve account deletion (NDPR right to erasure). Requires the current
 * password as a confirmation step, then removes personal data (anonymizing if
 * orders must be retained) and signs the user out.
 */
export async function deleteMyAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in to delete your account");

  const password = formData.get("password") as string;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("Account not found");

  // Password-protected accounts must re-confirm; passwordless (guest-origin)
  // accounts are authorized by their active session alone.
  if (user.passwordHash) {
    if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
      redirect("/account?deleteError=password");
    }
  }

  // Erasure can't be used to escape pending orders or an unpaid balance —
  // re-checked here (not just in the UI) so a direct POST can't bypass it.
  const blockers = await getDeletionBlockers(user.id);
  if (blockers.length > 0) {
    redirect("/account?deleteError=blocked");
  }

  await deleteUserAccount(user.id);
  // Clears the session cookie and lands them back on the storefront.
  await signOut({ redirectTo: "/" });
}
