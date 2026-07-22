import { storeConfig } from "@/config/store";

/**
 * Support-bot FAQ: quick-reply topics with keyword matching for free text.
 * Answers are plain strings (no markdown) rendered in chat bubbles. The
 * "order-status" topic is special-cased server-side (looks up the user's
 * latest order) — its `answer` here is only the signed-out/no-orders fallback.
 */
export type FaqTopic = {
  id: string;
  /** Quick-reply button label. */
  label: string;
  /** Lowercase keywords matched against free-text messages. */
  keywords: string[];
  answer: string;
};

export const FAQ_TOPICS: FaqTopic[] = [
  {
    id: "delivery",
    label: "Delivery & fees",
    keywords: ["deliver", "delivery", "shipping", "ship", "fee", "how long", "when will"],
    answer: `We deliver to your door for a flat fee of ₦${storeConfig.deliveryFeeFlat.toLocaleString()} on physical items. Services are rendered at your location or as arranged with the provider. You'll see the delivery fee at checkout before you pay.`,
  },
  {
    id: "payment",
    label: "Payment options",
    keywords: ["pay", "payment", "card", "transfer", "ussd", "paystack", "deposit", "cash"],
    answer:
      "You can pay online with card, bank transfer, or USSD (via Paystack), or pay on delivery. Some items also let you pay a deposit now and the balance later — you'll see that option on the product page.",
  },
  {
    id: "returns",
    label: "Returns",
    keywords: ["return", "refund", "exchange", "broken", "damaged", "wrong item"],
    answer:
      "If something's wrong with your order, report it within 7 days of delivery and we'll make it right. Message an agent here or reach us on WhatsApp with your order number.",
  },
  {
    id: "order-status",
    label: "Where is my order?",
    keywords: ["order", "track", "tracking", "status", "where is", "arrive"],
    answer:
      "Sign in and open Account → Order history to see live status and tracking for every order. If you checked out as a guest, ask an agent here with your order number.",
  },
];

/** First FAQ topic whose keywords appear in the text, if any. */
export function matchFaqTopic(text: string): FaqTopic | undefined {
  const lower = text.toLowerCase();
  return FAQ_TOPICS.find((t) => t.keywords.some((k) => lower.includes(k)));
}
