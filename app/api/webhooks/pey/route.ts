import { Webhook } from "standardwebhooks";
import { findPaymentForWebhook, markPaid } from "@/lib/db";
import { peyWebhookSecret } from "@/lib/env";
import { jsonError, respond } from "@/lib/http";
import { pesosMatchCents } from "@/lib/money";

type PeyEvent = {
  type?: string;
  amount?: number;
  codiQrId?: string;
  transactionId?: string;
  metadata?: { externalMetadata?: { paymentId?: string | number } };
};

function paymentIdOf(event: PeyEvent): number | null {
  const raw = event.metadata?.externalMetadata?.paymentId;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function POST(request: Request) {
  const raw = await request.text();
  const webhookId = request.headers.get("webhook-id") ?? "";
  let event: PeyEvent;
  try {
    event = new Webhook(peyWebhookSecret()).verify(raw, {
      "webhook-id": webhookId,
      "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": request.headers.get("webhook-signature") ?? "",
    }) as PeyEvent;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Falta la variable")) return respond(error);
    return jsonError("Firma inválida.", 401);
  }

  const type = event.type ?? "";
  console.info("Webhook de Pey", { webhookId, type });

  if (type !== "codi.qr.payment_received" && type !== "codi.pn.payment_received") {
    return new Response(null, { status: 200 });
  }

  try {
    const payment = await findPaymentForWebhook({
      qrId: type === "codi.qr.payment_received" ? event.codiQrId : null,
      transactionId: type === "codi.pn.payment_received" ? event.transactionId : null,
      paymentId: paymentIdOf(event),
    });
    if (!payment) {
      console.info("Webhook sin pago local", { webhookId, type });
      return new Response(null, { status: 200 });
    }
    if (typeof event.amount !== "number" || !pesosMatchCents(event.amount, payment.charged_cents)) {
      console.warn("Webhook con monto distinto", {
        webhookId,
        paymentId: payment.id,
        chargedCents: payment.charged_cents,
      });
      return new Response(null, { status: 200 });
    }
    const transactionId = event.transactionId || payment.pey_transaction_id || `pey-${payment.id}`;
    await markPaid(payment.id, transactionId);
    return new Response(null, { status: 200 });
  } catch (error) {
    return respond(error);
  }
}
