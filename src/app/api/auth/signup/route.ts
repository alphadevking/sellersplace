import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { verifyCode } from "@/lib/verification";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, name, agreed, code } = body;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and an 8+ character password are required" },
      { status: 400 }
    );
  }

  // Consent is enforced server-side, not just by the checkbox UI — accounts
  // cannot exist without agreement to the Terms and Privacy Policy (NDPR).
  if (agreed !== true) {
    return NextResponse.json(
      { error: "You must agree to the Terms of Service and Privacy Policy to create an account" },
      { status: 400 }
    );
  }

  // Email ownership: when email is configured, a valid one-time code is
  // required — this is what stops someone claiming a guest account (and its
  // order history) using only a known email address. Deployments without
  // email infra skip the gate entirely, preserving today's behaviour.
  if (isEmailConfigured()) {
    if (!(await verifyCode(email, "SIGNUP", String(code ?? "")))) {
      return NextResponse.json(
        { error: "That verification code is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.passwordHash) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    // This email previously checked out as a guest — upgrade that account
    // rather than creating a duplicate, so their past orders stay attached.
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: name || existing.name, isGuest: false },
    });
  } else {
    await prisma.user.create({
      data: { email, passwordHash, name, isGuest: false },
    });
  }

  return NextResponse.json({ success: true });
}
