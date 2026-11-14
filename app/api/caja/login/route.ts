import { cookies } from "next/headers";
import { CASHIER_COOKIE, cashierToken, pinsMatch } from "@/lib/auth";
import { cashierPin, isProduction } from "@/lib/env";
import { isRecord, jsonError, readJson } from "@/lib/http";

export async function POST(request: Request) {
  const pin = cashierPin();
  if (!pin) {
    return jsonError("Falta configurar el PIN de la caja. Define CASHIER_PIN en el servidor.", 503);
  }
  const body = await readJson(request);
  const input = isRecord(body) && typeof body.pin === "string" ? body.pin : "";
  if (!pinsMatch(input, pin)) return jsonError("PIN incorrecto.", 401);

  const jar = await cookies();
  jar.set(CASHIER_COOKIE, cashierToken(pin), {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 14,
  });
  return Response.json({ ok: true });
}
