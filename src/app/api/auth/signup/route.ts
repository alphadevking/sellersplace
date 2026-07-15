import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and an 8+ character password are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.passwordHash) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

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
