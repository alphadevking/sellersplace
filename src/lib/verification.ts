import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { VerificationPurpose } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { emailShell, sendEmail } from "@/lib/email";
import { storeConfig } from "@/config/store";

/**
 * One-time email codes (OTP) for signup verification and password reset.
 * Codes are 6 digits, valid for 10 minutes, stored only as bcrypt hashes,
 * and limited to 5 wrong guesses before they burn.
 */

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Max codes per email+purpose per window — keeps us off spam lists. */
const SEND_WINDOW_MS = 15 * 60 * 1000;
const SEND_WINDOW_MAX = 3;

const SUBJECTS: Record<VerificationPurpose, string> = {
  SIGNUP: `Your ${storeConfig.name} verification code`,
  PASSWORD_RESET: `Reset your ${storeConfig.name} password`,
};

const INTROS: Record<VerificationPurpose, string> = {
  SIGNUP: "Use this code to verify your email and finish creating your account:",
  PASSWORD_RESET: "Use this code to reset your password:",
};

/**
 * Creates and emails a fresh code. Returns false when rate-limited or when
 * the email couldn't be sent — callers should surface a generic message
 * either way (never confirm whether an account exists).
 */
export async function sendVerificationCode(
  email: string,
  purpose: VerificationPurpose
): Promise<boolean> {
  const recent = await prisma.verificationToken.count({
    where: { email, purpose, createdAt: { gte: new Date(Date.now() - SEND_WINDOW_MS) } },
  });
  if (recent >= SEND_WINDOW_MAX) return false;

  // crypto-random, never Math.random, and always 6 digits.
  const code = crypto.randomInt(100000, 1000000).toString();

  // A new code replaces older live ones; expired rows get swept opportunistically.
  await prisma.verificationToken.deleteMany({
    where: { OR: [{ email, purpose }, { expiresAt: { lt: new Date() } }] },
  });
  await prisma.verificationToken.create({
    data: {
      email,
      purpose,
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  return sendEmail({
    to: email,
    subject: SUBJECTS[purpose],
    html: emailShell(
      SUBJECTS[purpose],
      `<p style="font-size:14px;color:#444;margin:0 0 16px;">${INTROS[purpose]}</p>
       <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:12px 0;">${code}</div>
       <p style="font-size:12px;color:#6f6d66;margin:16px 0 0;">
         The code expires in 10 minutes. If you didn't request it, you can ignore this email.
       </p>`
    ),
  });
}

/**
 * Checks a submitted code. Consumes the token on success; counts and caps
 * wrong attempts so 6 digits can't be brute-forced.
 */
export async function verifyCode(
  email: string,
  purpose: VerificationPurpose,
  code: string
): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;

  const token = await prisma.verificationToken.findFirst({
    where: { email, purpose, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token || token.attempts >= MAX_ATTEMPTS) return false;

  const valid = await bcrypt.compare(code, token.codeHash);
  if (!valid) {
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  // Single-use: burn it on success.
  await prisma.verificationToken.delete({ where: { id: token.id } });
  return true;
}
