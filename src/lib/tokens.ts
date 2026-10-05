import { randomBytes } from "node:crypto";

// No look-alike characters (0/O, 1/l/I), so links survive being read aloud or retyped.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Random, non-sequential token. 22 characters from a 56-letter alphabet is
 * about 127 bits of entropy. Uses rejection sampling to avoid modulo bias.
 */
export function randomToken(length = 22): string {
  const out: string[] = [];
  const limit = 256 - (256 % ALPHABET.length);
  while (out.length < length) {
    for (const b of randomBytes(length * 2)) {
      if (b < limit) out.push(ALPHABET[b % ALPHABET.length]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}

export const isToken = (s: string, length = 22) => new RegExp(`^[${ALPHABET}]{${length}}$`).test(s);

/** Human-friendly order reference shown to customers and support, e.g. WT-7NWHV5. */
export const orderReference = () => "WT-" + randomToken(6).toUpperCase();
