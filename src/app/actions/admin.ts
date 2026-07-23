"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  InquiryStatus,
  OfferingType,
  OrderStatus,
  PriceType,
  Prisma,
  PurchaseMode,
} from "@prisma/client";
import { getAdminSession, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/orders";
import { uploadImage } from "@/lib/cloudinary";
import { productHref } from "@/lib/product-url";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function uploadProductImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Not authorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided" };
  if (!file.type.startsWith("image/")) return { error: "File must be an image" };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Image must be under 8MB" };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(buffer);
    return { url };
  } catch {
    return { error: "Upload failed — please try again" };
  }
}

/** Fulfilment sequence used to detect backward (correction-only) moves. */
const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export async function setOrderStatus(formData: FormData) {
  await requireAdmin();

  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as string;
  const note = (formData.get("note") as string)?.trim();
  const force = formData.get("force") === "on";

  if (!orderId || !Object.values(OrderStatus).includes(status as OrderStatus)) {
    throw new Error("Invalid order status update");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error("Order not found");

  if (order.status === status) {
    redirect(`/admin/orders/${orderId}?statusError=same`);
  }

  // Guard: shipping a physical order without tracking info leaves the customer
  // with nothing to follow — save tracking first (or tick the override).
  const hasPhysical = order.items.some((i) => i.product && i.product.offeringType !== "SERVICE");
  if (
    status === "SHIPPED" &&
    hasPhysical &&
    !order.carrier &&
    !order.trackingNumber &&
    !force
  ) {
    redirect(`/admin/orders/${orderId}?statusError=tracking`);
  }

  // Guard: backward moves (e.g. DELIVERED → PROCESSING) are corrections, not
  // normal flow — they notify the customer again, so require the override.
  const fromIdx = STATUS_ORDER.indexOf(order.status);
  const toIdx = STATUS_ORDER.indexOf(status as OrderStatus);
  if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx && !force) {
    redirect(`/admin/orders/${orderId}?statusError=backward`);
  }

  await updateOrderStatus(orderId, status as OrderStatus, note || undefined);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/**
 * Marks a cancelled-but-paid order as refunded once the money has been
 * returned (Paystack dashboard/bank transfer). Customer sees the refund state
 * on their order page.
 */
export async function markOrderRefunded(formData: FormData) {
  await requireAdmin();

  const orderId = formData.get("orderId") as string;
  if (!orderId) throw new Error("Missing order id");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status !== "CANCELLED" || Number(order.amountPaid) <= 0) {
    throw new Error("Only cancelled, paid orders can be marked refunded");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "REFUNDED",
      statusHistory: {
        create: { status: "CANCELLED", note: "Refund issued to customer" },
      },
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
}

type InvoiceLine = { title: string; quantity: number; unitPrice: number };

/**
 * Issues an invoice for quoted/bespoke work (usually from an inquiry): creates
 * an order with custom line items and an unguessable pay link the customer can
 * open without an account.
 */
export async function createInvoice(formData: FormData) {
  await requireAdmin();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const note = (formData.get("note") as string)?.trim() || null;
  const inquiryId = (formData.get("inquiryId") as string) || null;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Valid customer email required");
  if (!name) throw new Error("Customer name required");

  let lines: InvoiceLine[];
  try {
    lines = JSON.parse((formData.get("lines") as string) || "[]");
  } catch {
    throw new Error("Invalid invoice lines");
  }
  lines = lines
    .map((l) => ({
      title: String(l.title || "").trim(),
      quantity: Math.max(1, Math.trunc(Number(l.quantity) || 1)),
      unitPrice: Number(l.unitPrice),
    }))
    .filter((l) => l.title && Number.isFinite(l.unitPrice) && l.unitPrice > 0);
  if (lines.length === 0) throw new Error("At least one line item with a price is required");

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, ...(phone ? { phone } : {}) },
    create: { email, name, phone, isGuest: true },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `SS-INV-${Date.now().toString(36).toUpperCase()}`,
      userId: user.id,
      isInvoice: true,
      accessToken: crypto.randomBytes(24).toString("base64url"),
      customerNote: note,
      subtotal: total,
      deliveryFee: 0,
      total,
      items: {
        create: lines.map((l) => ({
          titleOverride: l.title,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      },
      statusHistory: { create: { status: "PENDING", note: "Invoice issued" } },
    },
  });

  if (inquiryId) {
    await prisma.inquiry
      .update({ where: { id: inquiryId }, data: { status: "RESPONDED" } })
      .catch(() => {}); // stale inquiry id shouldn't block the invoice
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/inquiries");
  redirect(`/admin/orders/${order.id}`);
}

/** Validates an http(s) tracking URL from a form; null when blank. */
function parseTrackingUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("bad protocol");
    }
    return parsed.toString();
  } catch {
    throw new Error("Tracking link must be a valid http(s) URL");
  }
}

/** Shipment tracking details, editable after dispatch. */
export async function setOrderTracking(formData: FormData) {
  await requireAdmin();

  const orderId = formData.get("orderId") as string;
  if (!orderId) throw new Error("Missing order id");

  const carrier = (formData.get("carrier") as string)?.trim() || null;
  const trackingNumber = (formData.get("trackingNumber") as string)?.trim() || null;
  const trackingUrl = parseTrackingUrl(formData.get("trackingUrl") as string);

  await prisma.order.update({
    where: { id: orderId },
    data: { carrier, trackingNumber, trackingUrl },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
}

/**
 * The dispatch step as one action: captures carrier/tracking and marks the
 * order SHIPPED together, so the customer's "on its way" notification never
 * goes out without something to follow. Physical orders require a carrier or
 * tracking number; service-only orders ship without.
 */
export async function shipOrder(formData: FormData) {
  await requireAdmin();

  const orderId = formData.get("orderId") as string;
  if (!orderId) throw new Error("Missing order id");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.status !== "CONFIRMED" && order.status !== "PROCESSING") {
    redirect(`/admin/orders/${orderId}?statusError=notready`);
  }

  const carrier = (formData.get("carrier") as string)?.trim() || null;
  const trackingNumber = (formData.get("trackingNumber") as string)?.trim() || null;
  const trackingUrl = parseTrackingUrl(formData.get("trackingUrl") as string);

  const hasPhysical = order.items.some((i) => i.product && i.product.offeringType !== "SERVICE");
  if (hasPhysical && !carrier && !trackingNumber) {
    redirect(`/admin/orders/${orderId}?statusError=tracking`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { carrier, trackingNumber, trackingUrl },
  });

  const note = (formData.get("note") as string)?.trim();
  await updateOrderStatus(
    orderId,
    "SHIPPED",
    note || (carrier ? `Dispatched via ${carrier}` : undefined)
  );

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function setInquiryStatus(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !Object.values(InquiryStatus).includes(status as InquiryStatus)) {
    throw new Error("Invalid inquiry status update");
  }

  await prisma.inquiry.update({ where: { id }, data: { status: status as InquiryStatus } });

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productDataFromForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Product name is required");

  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price");

  const compareAtRaw = (formData.get("compareAtPrice") as string)?.trim();
  const compareAtPrice = compareAtRaw ? Number(compareAtRaw) : null;
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
    throw new Error("Invalid compare-at price");
  }

  const images = ((formData.get("images") as string) || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const purchaseModeRaw = (formData.get("purchaseMode") as string) || "PAY_ONLINE";
  if (!Object.values(PurchaseMode).includes(purchaseModeRaw as PurchaseMode)) {
    throw new Error("Invalid purchase mode");
  }

  const offeringTypeRaw = (formData.get("offeringType") as string) || "PRODUCT";
  if (!Object.values(OfferingType).includes(offeringTypeRaw as OfferingType)) {
    throw new Error("Invalid offering type");
  }

  const priceTypeRaw = (formData.get("priceType") as string) || "FIXED";
  if (!Object.values(PriceType).includes(priceTypeRaw as PriceType)) {
    throw new Error("Invalid price type");
  }

  const depositRaw = (formData.get("depositPercent") as string)?.trim();
  const depositPercent = depositRaw ? Math.trunc(Number(depositRaw)) : null;
  if (depositPercent !== null && (depositPercent < 1 || depositPercent > 99)) {
    throw new Error("Deposit must be between 1 and 99 percent");
  }

  return {
    name,
    description: (formData.get("description") as string)?.trim() || null,
    brand: (formData.get("brand") as string)?.trim() || null,
    purchaseMode: purchaseModeRaw as PurchaseMode,
    offeringType: offeringTypeRaw as OfferingType,
    priceType: priceTypeRaw as PriceType,
    depositPercent,
    price: new Prisma.Decimal(price),
    compareAtPrice: compareAtPrice === null ? null : new Prisma.Decimal(compareAtPrice),
    stock: Math.max(0, Math.trunc(Number(formData.get("stock")) || 0)),
    sku: (formData.get("sku") as string)?.trim() || null,
    categoryId: (formData.get("categoryId") as string) || null,
    isActive: formData.get("isActive") === "on",
    images,
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const data = productDataFromForm(formData);

  // Auto-slug from the name; suffix if taken so create never fails on a duplicate.
  const base = slugify(data.name) || "product";
  let slug = base;
  for (let n = 2; await prisma.product.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }

  await prisma.product.create({ data: { ...data, slug } });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing product id");

  const data = productDataFromForm(formData);
  const product = await prisma.product.update({ where: { id }, data });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/");
  revalidatePath(productHref(product));
  redirect("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing product id");

  const product = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/admin/products");
  revalidatePath("/");
}
