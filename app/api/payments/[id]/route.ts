import { connection } from "next/server";
import { getPayment } from "@/lib/db";
import { jsonError, respond } from "@/lib/http";
import { reconcileIfDue } from "@/lib/payments/reconcile";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  try {
    const { id } = await context.params;
    const paymentId = Number(id);
    if (!Number.isInteger(paymentId)) return jsonError("No encontramos ese pago.", 404);
    const payment = await getPayment(paymentId);
    if (!payment) return jsonError("No encontramos ese pago.", 404);
    const current = await reconcileIfDue(payment);
    return Response.json({ status: current.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return respond(error);
  }
}
