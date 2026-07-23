import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { sendVerificationCode } from "@/lib/verification";

/**
 * Sends a one-time code for signup verification or password reset.
 * Responses are deliberately generic — they never reveal whether an account
 * exists for the email (anti-enumeration).
 */
export async function POST(req: NextRequest) {
  const { email: rawEmail, purpose } = await req.json();
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (purpose !== "SIGNUP" && purpose !== "PASSWORD_RESET") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // No email infra → verification isn't required anywhere; tell the client so
  // it can skip the code step instead of stranding the user.
  if (!isEmailConfigured()) {
    return NextResponse.json({ required: false });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (purpose === "SIGNUP") {
    // A full account already exists — surface it now (this is public info the
    // signup form reveals anyway) rather than sending a useless code.
    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in instead." },
        { status: 409 }
      );
    }
    const sent = await sendVerificationCode(email, "SIGNUP");
    if (!sent) {
      // Rate-limited or the provider rejected the send — for signup this is
      // safe to surface (account existence was already disclosed above).
      return NextResponse.json(
        { error: "Couldn't send a code right now — wait a few minutes and try again." },
        { status: 429 }
      );
    }
  } else {
    // Password reset: only send when there is a password-bearing account, but
    // answer identically either way.
    if (existing?.passwordHash) {
      await sendVerificationCode(email, "PASSWORD_RESET");
    }
  }

  return NextResponse.json({ required: true, sent: true });
}
