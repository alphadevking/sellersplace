import { storeConfig } from "@/config/store";
import { FAQ_TOPICS } from "@/config/faq";

/**
 * Optional LLM tier for the support chat. Provider-neutral by design (the
 * store owner brings whichever key they have): Anthropic, OpenAI, Gemini, or
 * Mistral — detected from env at call time. When no key is configured, every
 * call returns null and the bot falls back to FAQ matching + agent escalation.
 *
 * Env:
 *   SUPPORT_LLM_PROVIDER  optional: anthropic | openai | gemini | mistral
 *                         (otherwise the first configured key wins, in that order)
 *   SUPPORT_LLM_MODEL     optional model override for the chosen provider
 *   ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY / MISTRAL_API_KEY
 */

type Provider = "anthropic" | "openai" | "gemini" | "mistral";

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-opus-4-8",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  mistral: "mistral-small-latest",
};

const KEY_ENV: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  mistral: "MISTRAL_API_KEY",
};

const PROVIDER_ORDER: Provider[] = ["anthropic", "openai", "gemini", "mistral"];

const TIMEOUT_MS = 15_000;
const MAX_TOKENS = 400;

function resolveProvider(): { provider: Provider; key: string; model: string } | null {
  const forced = process.env.SUPPORT_LLM_PROVIDER as Provider | undefined;
  const candidates = forced && PROVIDER_ORDER.includes(forced) ? [forced] : PROVIDER_ORDER;
  for (const provider of candidates) {
    const key = process.env[KEY_ENV[provider]];
    if (key) {
      return {
        provider,
        key,
        model: process.env.SUPPORT_LLM_MODEL || DEFAULT_MODELS[provider],
      };
    }
  }
  return null;
}

/** True when a provider key is configured — lets the UI hint at smarter replies. */
export function isLlmConfigured(): boolean {
  return resolveProvider() !== null;
}

export type ChatTurn = { role: "user" | "assistant"; text: string };

function systemPrompt(): string {
  const faq = FAQ_TOPICS.map((t) => `- ${t.label}: ${t.answer}`).join("\n");
  return [
    `You are the support assistant for ${storeConfig.name}, an online store (${storeConfig.description}). Prices are in NGN (₦).`,
    `Store facts you may rely on:\n${faq}`,
    "Rules: Be warm, concise (2-4 sentences), and honest. Never invent order details, stock levels, prices, or policies beyond the facts above. If you don't know, or the customer needs account/order-specific help, a refund, or wants a human, say you'll connect them to an agent and nothing more. Plain text only — no markdown, no lists.",
  ].join("\n\n");
}

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Support LLM request failed: ${res.status} ${await res.text()}`);
      return null;
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("Support LLM request error:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generate a support reply from the configured provider, or null when no
 * provider is configured or the call fails (callers must handle null by
 * offering agent escalation instead).
 */
export async function generateSupportReply(turns: ChatTurn[]): Promise<string | null> {
  const resolved = resolveProvider();
  if (!resolved || turns.length === 0) return null;
  const { provider, key, model } = resolved;
  const system = systemPrompt();
  // Keep the context small — support threads don't need deep history.
  const recent = turns.slice(-10);

  try {
    if (provider === "anthropic") {
      // Messages API; modern Claude models reject temperature/top_p — omit them.
      const data = await post(
        "https://api.anthropic.com/v1/messages",
        { "x-api-key": key, "anthropic-version": "2023-06-01" },
        {
          model,
          max_tokens: MAX_TOKENS,
          system,
          messages: recent.map((t) => ({ role: t.role, content: t.text })),
        }
      );
      const content = data?.content as { type: string; text?: string }[] | undefined;
      const text = content?.find((b) => b.type === "text")?.text;
      return text?.trim() || null;
    }

    if (provider === "openai" || provider === "mistral") {
      const base =
        provider === "openai" ? "https://api.openai.com" : "https://api.mistral.ai";
      const data = await post(
        `${base}/v1/chat/completions`,
        { authorization: `Bearer ${key}` },
        {
          model,
          max_tokens: MAX_TOKENS,
          messages: [
            { role: "system", content: system },
            ...recent.map((t) => ({ role: t.role, content: t.text })),
          ],
        }
      );
      const choices = data?.choices as
        | { message?: { content?: string } }[]
        | undefined;
      return choices?.[0]?.message?.content?.trim() || null;
    }

    // Gemini
    const data = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {},
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: recent.map((t) => ({
          role: t.role === "assistant" ? "model" : "user",
          parts: [{ text: t.text }],
        })),
        generationConfig: { maxOutputTokens: MAX_TOKENS },
      }
    );
    const candidates = data?.candidates as
      | { content?: { parts?: { text?: string }[] } }[]
      | undefined;
    const text = candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    console.error("Support LLM generation error:", err);
    return null;
  }
}
