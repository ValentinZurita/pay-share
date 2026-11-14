import { getPayment, markPaid } from "@/lib/db";
import { peyMode } from "@/lib/env";
import { isRecord, jsonError, readJson, respond } from "@/lib/http";

export async function POST(request: Request) {
  try {
    if (peyMode() !== "mock") return jsonError("No disponible.", 404);
    const body = await readJson(request);
    if (!isRecord(body) || typeof body.paymentId !== "number" || !Number.isInteger(body.paymentId)) {
      return jsonError("La solicitud no es válida.", 400);
    }
    const payment = await getPayment(body.paymentId);
    if (!payment) return jsonError("No encontramos ese pago.", 404);
    await markPaid(payment.id, payment.pey_transaction_id ?? `mock-paid-${payment.id}`);
    return Response.json({ ok: true });
  } catch (error) {
    return respond(error);
  }
}
