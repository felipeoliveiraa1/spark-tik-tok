import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./config.js";

/**
 * Sign a payload (already-serialized string) with the shared secret.
 * Signature is hex-encoded SHA-256 HMAC.
 */
export function sign(payload: string, secret = env.SCRAPER_HMAC_SECRET): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Constant-time signature comparison.
 */
export function verify(payload: string, signature: string, secret = env.SCRAPER_HMAC_SECRET): boolean {
  const expected = sign(payload, secret);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
