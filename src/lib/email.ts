import { storeConfig } from "@/config/store";

/**
 * Transactional email via Resend's REST API (no SDK dependency — mirrors the
 * raw-fetch pattern used for the LLM providers). Deployments without a
 * RESEND_API_KEY simply have email features disabled; nothing breaks.
 */

/**
 * Whether email can actually reach ARBITRARY recipients — the condition under
 * which customer-facing features (signup verification, password reset) may be
 * enforced. Requires BOTH an API key AND a real EMAIL_FROM (a verified sending
 * domain). A bare key with the sandbox sender only reaches the Resend account
 * owner, so it must NOT gate real customers — otherwise everyone but the owner
 * is locked out of signup. Fails safe: no verified sender → treat as off.
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

/**
 * Whether email can be sent AT ALL, including via Resend's sandbox sender
 * (onboarding@resend.dev), which only delivers to the Resend account owner.
 * Used for local testing of the email pipeline, never to gate customers.
 */
export function isEmailSendable(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * From address: set EMAIL_FROM once the store's domain is verified in Resend
 * (e.g. "MyStore <hello@mystore.com>"). The onboarding@resend.dev default
 * works out of the box for testing but can only send to the Resend account
 * owner's own email address.
 */
function fromAddress(): string {
  return process.env.EMAIL_FROM || `${storeConfig.name} <onboarding@resend.dev>`;
}

/** Sends one email; returns false (and logs) on any failure rather than throwing. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!isEmailSendable()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      console.error("Email send failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

/** Minimal branded shell shared by all transactional emails. */
export function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f5f2;font-family:Arial,Helvetica,sans-serif;color:#14140f;">
    <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
      <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">${storeConfig.name}</div>
      <div style="background:#ffffff;border-radius:16px;padding:28px 24px;">
        <div style="font-size:16px;font-weight:bold;margin-bottom:12px;">${title}</div>
        ${bodyHtml}
      </div>
      <div style="font-size:11px;color:#6f6d66;margin-top:16px;">
        ${storeConfig.name} · <a href="${storeConfig.siteUrl}" style="color:#6f6d66;">${storeConfig.siteUrl.replace(/^https?:\/\//, "")}</a>
      </div>
    </div>
  </body>
</html>`;
}
