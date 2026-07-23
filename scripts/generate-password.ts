/**
 * Strong password generator CLI — for filling the app's auth forms and admin
 * seed passwords. Shares its logic with the in-form "suggest" button
 * (src/lib/password.ts), so both produce identical-quality passwords.
 *
 * Usage:
 *   pnpm gen:password              # one 16-char password
 *   pnpm gen:password 24           # one 24-char password
 *   pnpm gen:password 16 5         # five 16-char passwords
 */
import { generatePassword } from "../src/lib/password";

const length = Number.parseInt(process.argv[2] ?? "16", 10) || 16;
const count = Number.parseInt(process.argv[3] ?? "1", 10) || 1;

for (let i = 0; i < count; i++) {
  console.log(generatePassword(length));
}
