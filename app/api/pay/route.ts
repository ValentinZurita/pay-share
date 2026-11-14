import { attachProviderRefs, createPendingPayment, deletePendingPayment, getBillContext } from "@/lib/db";
import { demoMode } from "@/lib/env";
import { isRecord, jsonError, readJson, respond } from "@/lib/http";
import { formatMXN } from "@/lib/money";
import { getProvider } from "@/lib/payments/provider";
import type { PaymentMethod } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (!isRecord(body)) return jsonError("La solicitud no es válida.", 400);

    const { billId, amountCents, method } = body;
    const tipCents = body.tipCents ?? 0;
    if (typeof billId !== "number" || !Number.isInteger(billId) || billId <= 0) {
      return jsonError("La cuenta no es válida.", 400);
    }
    if (typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents <= 0) {
      return jsonError("Escribe solo el monto, por ejemplo 300.", 400);
    }
    if (typeof tipCents !== "number" || !Number.isInteger(tipCents) || tipCents < 0) {
      return jsonError("La propina debe ser un monto, por ejemplo 30.", 400);
    }
    if (method !== "qr" && method !== "pn") return jsonError("Elige cómo quieres pagar.", 400);

    let phone: string | undefined;
    if (method === "pn") {
      if (typeof body.phone !== "string" || !/^\d{10}$/.test(body.phone)) {
        return jsonError("Escribe el celular a 10 dígitos.", 400);
      }
      phone = body.phone;
    }

    let payerName: string | null = null;
    if (typeof body.name === "string" && body.name.trim()) {
      payerName = body.name.trim().slice(0, 20);
    }

    const bill = await getBillContext(billId);
    if (!bill) return jsonError("No encontramos esa cuenta.", 404);
    if (bill.status !== "open") return jsonError("Esta mesa no tiene cuenta abierta.", 409);
    if (amountCents > bill.remainingCents) {
      return jsonError(`El restante es ${formatMXN(bill.remainingCents)}.`, 400);
    }

    const chargeCents = demoMode() ? 1 : amountCents + tipCents;
    const expirationSeconds = method === "pn" ? 360 : 900;
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000).toISOString();
    const payment = await createPendingPayment({
      billId: bill.id,
      amountCents,
      tipCents,
      chargedCents: chargeCents,
      payerName,
      method: method as PaymentMethod,
      expiresAt,
    });

    try {
      const result = await getProvider().createCharge({
        paymentId: payment.id,
        billId: bill.id,
        chargeCents,
        concept: `${bill.tableName} cuenta ${bill.id}`,
        expirationSeconds,
        method,
        phone,
      });
      await attachProviderRefs(payment.id, {
        qrId: result.qrId ?? null,
        transactionId: result.transactionId ?? null,
      });
      return Response.json({
        paymentId: payment.id,
        method,
        qrString: result.qrString,
        expiresAt,
      });
    } catch (error) {
      await deletePendingPayment(payment.id);
      return respond(error);
    }
  } catch (error) {
    return respond(error);
  }
}
