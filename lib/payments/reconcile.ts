import { peyMode } from "@/lib/env";
import { markPaid } from "@/lib/db";
import { getProvider } from "@/lib/payments/provider";
import type { PaymentRow } from "@/lib/types";

const lastCheck = new Map<number, number>();
const INTERVAL_MS = 5_000;

export function resetReconcileForTests(): void {
  lastCheck.clear();
}

/** Como mucho una consulta a Pey cada 5 segundos por pago. */
export async function reconcileIfDue(payment: PaymentRow): Promise<PaymentRow> {
  if (payment.status !== "pending" || peyMode() !== "live") return payment;
  const now = Date.now();
  const previous = lastCheck.get(payment.id) ?? 0;
  if (now - previous < INTERVAL_MS) return payment;
  lastCheck.set(payment.id, now);

  try {
    const transactionId = await getProvider().findPaid({
      qrId: payment.pey_qr_id ?? undefined,
      transactionId: payment.pey_transaction_id ?? undefined,
    });
    if (!transactionId) return payment;
    const updated = await markPaid(payment.id, transactionId);
    if (!updated) return payment;
    return {
      ...payment,
      status: "paid",
      paid_at: new Date().toISOString(),
      pey_transaction_id: transactionId,
    };
  } catch (error) {
    console.error("No se pudo consultar el cobro en Pey", error instanceof Error ? error.message : "error");
    return payment;
  }
}
