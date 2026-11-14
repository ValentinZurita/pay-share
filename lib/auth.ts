import { createHmac, timingSafeEqual } from "node:crypto";

export const CASHIER_COOKIE = "cashier_session";

export function cashierToken(pin: string): string {
  return createHmac("sha256", pin).update("pay-share-cashier-v1").digest("base64url");
}

/** Comparación en tiempo constante, sin filtrar la longitud del PIN. */
export function pinsMatch(input: string, expected: string): boolean {
  const left = createHmac("sha256", "pay-share-pin").update(input).digest();
  const right = createHmac("sha256", "pay-share-pin").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function cashierCookieMatches(value: string | undefined, pin: string): boolean {
  if (!value) return false;
  const expected = cashierToken(pin);
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
