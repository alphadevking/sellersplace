"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Fire-and-forget lead tracking: called when a customer opens WhatsApp/phone
 * for a contact-mode offering, so the admin inquiries list reflects real
 * interest even when the conversation happens off-platform.
 */
export async function logContactClick(
  productId: string,
  channel: "WHATSAPP" | "PHONE",
  variantName?: string
) {
  try {
    const session = await auth();
    // Light abuse cap for signed-in users; anonymous clicks are metadata-only.
    if (session?.user?.id) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recent = await prisma.inquiry.count({
        where: { userId: session.user.id, createdAt: { gt: oneHourAgo } },
      });
      if (recent >= 30) return;
    }
    await prisma.inquiry.create({
      data: {
        productId,
        userId: session?.user?.id,
        variantName: variantName || null,
        channel,
      },
    });
  } catch (err) {
    // Tracking must never block the customer from reaching the seller.
    console.error("Failed to log contact click:", err);
  }
}

export type InquiryFormState = { ok: boolean; error?: string };

/** Inquiry form submission — the on-platform fallback to WhatsApp. */
export async function submitInquiry(
  _prev: InquiryFormState,
  formData: FormData
): Promise<InquiryFormState> {
  const productId = (formData.get("productId") as string) || null;
  const variantName = (formData.get("variantName") as string)?.trim() || null;
  const name = (formData.get("name") as string)?.trim();
  const contact = (formData.get("contact") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!name || !contact || !message) {
    return { ok: false, error: "Please fill in your name, contact, and message." };
  }
  if (name.length > 120 || contact.length > 160 || message.length > 2000) {
    return { ok: false, error: "One of the fields is too long." };
  }

  // Basic abuse control: cap how many form inquiries a single contact (or
  // signed-in user) can file per hour. DB-count based, so it works on
  // serverless without extra infrastructure.
  const session = await auth();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.inquiry.count({
    where: {
      channel: "FORM",
      createdAt: { gt: oneHourAgo },
      OR: [{ contact }, ...(session?.user?.id ? [{ userId: session.user.id }] : [])],
    },
  });
  if (recent >= 5) {
    return {
      ok: false,
      error: "You've sent several inquiries recently — please give us a little time to respond.",
    };
  }

  await prisma.inquiry.create({
    data: {
      productId,
      userId: session?.user?.id,
      variantName,
      name,
      contact,
      message,
      channel: "FORM",
    },
  });

  return { ok: true };
}
