/**
 * Strong password generator for filling the app's auth forms (signup, reset,
 * change password) and admin seed passwords.
 *
 * Usage:
 *   pnpm gen:password              # one 16-char password
 *   pnpm gen:password 24           # one 24-char password
 *   pnpm gen:password 16 5         # five 16-char passwords
 *
 * Guarantees at least one lowercase, uppercase, digit, and symbol, and uses
 * crypto-secure randomness (never Math.random). Minimum length is 8 to match
 * the app's own rule.
 */
import { randomInt } from "crypto";

const LOWER = "abcdefghijkmnpqrstuvwxyz"; // no l/o — avoid look-alikes
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O
const DIGITS = "23456789"; // no 0/1
const SYMBOLS = "!@#$%^&*-_=+?";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

/** Unbiased pick of one character from a set. */
function pick(set: string): string {
  return set[randomInt(set.length)];
}

/** Fisher–Yates shuffle with crypto randomness. */
function shuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

export function generatePassword(length = 16): string {
  const len = Math.max(8, length);
  // Seed one of each class so complexity rules always pass...
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  // ...then fill the rest from the full alphabet.
  for (let i = chars.length; i < len; i++) chars.push(pick(ALL));
  return shuffle(chars).join("");
}

const length = Number.parseInt(process.argv[2] ?? "16", 10) || 16;
const count = Number.parseInt(process.argv[3] ?? "1", 10) || 1;

for (let i = 0; i < count; i++) {
  console.log(generatePassword(length));
}
