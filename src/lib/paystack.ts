import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

/**
 * Initializes a Paystack transaction. Call this from the checkout API route
 * once the order has been created locally with PENDING status.
 */
export async function initializePaystackTransaction(params: {
  email: string;
  amountKobo: number; // Paystack expects the smallest currency unit (kobo for NGN)
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    throw new Error(`Paystack init failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<{
    status: boolean;
    message: string;
    data: { authorization_url: string; access_code: string; reference: string };
  }>;
}

/** Verifies a Paystack transaction reference server-side after payment. */
export async function verifyPaystackTransaction(reference: string) {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${getSecretKey()}` } }
  );

  if (!res.ok) {
    throw new Error(`Paystack verify failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<{
    status: boolean;
    data: { status: string; reference: string; amount: number };
  }>;
}

/** Validates the x-paystack-signature header on incoming webhooks. */
export function isValidPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", getSecretKey())
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
