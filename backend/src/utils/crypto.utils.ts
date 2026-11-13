import crypto from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks on sensitive tokens and digests.
 * Compares two strings without leaking timing information about length or character matches.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Perform dummy constant-time comparison to avoid leaking length differences
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
