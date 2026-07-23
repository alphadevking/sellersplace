import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/verification";

/**
 * Completes a password reset: a valid one-time code (from /api/auth/send-code
 * with purpose PASSWORD_RESET) authorizes setting a new password. The code is
 * the proof of email ownership, so no current password is needed.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, code } = body;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and an 8+ character password are required" },
      { status: 400 }
    );
  }

  if (!(await verifyCode(email, "PASSWORD_RESET", String(code ?? "")))) {
    return NextResponse.json(
      { error: "That reset code is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  // The code proves ownership; only update if a password-bearing account
  // exists (a guest with no password shouldn't be resettable this way).
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "No account with a password exists for this email." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });

  return NextResponse.json({ success: true });
}
