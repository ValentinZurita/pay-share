import { Webhook } from "standardwebhooks";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/webhooks/pey/route";
import { attachProviderRefs, createPendingPayment, getPayment, openBill, resetMemoryForTests } from "@/lib/db";

const secret = `whsec_${Buffer.from("pay-share-webhook-secret!!").toString("base64")}`;

function signed(payload: object, signature?: string) {
  const raw = JSON.stringify(payload);
  const id = "msg_test_1";
  const timestamp = new Date();
  const wh = new Webhook(secret);
  return new Request("http://local/api/webhooks/pey", {
    method: "POST",
    body: raw,
    headers: {
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signature ?? wh.sign(id, timestamp, raw),
    },
  });
}

beforeEach(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.PEY_WEBHOOK_SECRET = secret;
  process.env.PEY_MODE = "mock";
  resetMemoryForTests();
});

async function pendingQr() {
  const snapshot = await openBill(4, 50000);
  const payment = await createPendingPayment({
    billId: snapshot.bill!.id,
    amountCents: 30000,
    tipCents: 3000,
    chargedCents: 1,
    payerName: "Ana",
    method: "qr",
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
  });
  await attachProviderRefs(payment.id, { qrId: "QR-REAL" });
  return payment;
}

describe("webhook de Pey", () => {
  it("con firma válida marca pagado y un reenvío no duplica", async () => {
    const payment = await pendingQr();
    const payload = {
      type: "codi.qr.payment_received",
      amount: 0.01,
      codiQrId: "QR-REAL",
      transactionId: "TX-1",
      metadata: { externalMetadata: { paymentId: payment.id } },
    };
    const first = await POST(signed(payload));
    expect(first.status).toBe(200);
    const row = await getPayment(payment.id);
    expect(row?.status).toBe("paid");
    expect(row?.amount_cents).toBe(30000);
    expect(row?.pey_transaction_id).toBe("TX-1");

    const second = await POST(signed(payload));
    expect(second.status).toBe(200);
    const again = await getPayment(payment.id);
    expect(again?.status).toBe("paid");
    expect(again?.amount_cents).toBe(30000);
    expect(again?.paid_at).toBe(row?.paid_at);
  });

  it("firma inválida responde 401 y no cambia el pago", async () => {
    const payment = await pendingQr();
    const response = await POST(
      signed({ type: "codi.qr.payment_received", amount: 0.01, codiQrId: "QR-REAL", transactionId: "TX-2" }, "v1,nope"),
    );
    expect(response.status).toBe(401);
    expect((await getPayment(payment.id))?.status).toBe("pending");
  });

  it("un monto distinto no marca el pago", async () => {
    const payment = await pendingQr();
    const response = await POST(
      signed({
        type: "codi.qr.payment_received",
        amount: 9.99,
        codiQrId: "QR-REAL",
        transactionId: "TX-3",
      }),
    );
    expect(response.status).toBe(200);
    expect((await getPayment(payment.id))?.status).toBe("pending");
  });

  it("acepta el cobro al celular por transactionId", async () => {
    const snapshot = await openBill(2, 20000);
    const payment = await createPendingPayment({
      billId: snapshot.bill!.id,
      amountCents: 20000,
      tipCents: 0,
      chargedCents: 1,
      payerName: null,
      method: "pn",
      expiresAt: new Date(Date.now() + 360_000).toISOString(),
    });
    await attachProviderRefs(payment.id, { transactionId: "PN-1" });
    const response = await POST(
      signed({ type: "codi.pn.payment_received", amount: 0.01, transactionId: "PN-1" }),
    );
    expect(response.status).toBe(200);
    expect((await getPayment(payment.id))?.status).toBe("paid");
  });
});
