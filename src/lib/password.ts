/**
 * Isomorphic strong-password generator — one source of truth shared by the
 * signup/reset form's "suggest" button and the `pnpm gen:password` CLI. Uses
 * the Web Crypto API (`crypto.getRandomValues`), which is global in both
 * browsers and Node 20+, so it is safe to import from a client component.
 */

const LOWER = "abcdefghijkmnpqrstuvwxyz"; // no l/o — avoid look-alikes
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O
const DIGITS = "23456789"; // no 0/1
const SYMBOLS = "!@#$%^&*-_=+?";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

/** Crypto-secure integer in [0, max) using rejection sampling (no modulo bias). */
function randomInt(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

function pick(set: string): string {
  return set[randomInt(set.length)];
}

/** Fisher–Yates shuffle with crypto randomness. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a password with at least one lowercase, uppercase, digit, and
 * symbol, avoiding look-alike characters. Length is clamped to the app's
 * 8-character minimum.
 */
export function generatePassword(length = 16): string {
  const len = Math.max(8, length);
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  for (let i = chars.length; i < len; i++) chars.push(pick(ALL));
  return shuffle(chars).join("");
}
