import { beforeEach, describe, expect, it } from "vitest";
import { POST as openBillRoute } from "@/app/api/bills/route";
import { POST as closeBillRoute } from "@/app/api/bills/[id]/close/route";
import { POST as simulateRoute } from "@/app/api/dev/simulate/route";
import { POST as payRoute } from "@/app/api/pay/route";
import { getPayment, resetMemoryForTests } from "@/lib/db";

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.PEY_MODE = "mock";
  process.env.DEMO_MODE = "true";
  resetMemoryForTests();
});

describe("API de cuentas y pagos", () => {
  it("rechaza un total en cero y una segunda cuenta abierta", async () => {
    const zero = await openBillRoute(jsonRequest("http://local/api/bills", { tableId: 4, totalCents: 0 }));
    expect(zero.status).toBe(400);

    const first = await openBillRoute(jsonRequest("http://local/api/bills", { tableId: 4, totalCents: 50000 }));
    expect(first.status).toBe(201);
    const second = await openBillRoute(jsonRequest("http://local/api/bills", { tableId: 4, totalCents: 10000 }));
    expect(second.status).toBe(409);
  });

  it("rechaza una parte mayor al restante y cobra un centavo en demo", async () => {
    const opened = await openBillRoute(jsonRequest("http://local/api/bills", { tableId: 4, totalCents: 50000 }));
    const snapshot = (await opened.json()) as { bill: { id: number } };
    const tooMuch = await payRoute(
      jsonRequest("http://local/api/pay", { billId: snapshot.bill.id, amountCents: 60000, tipCents: 0, method: "qr" }),
    );
    expect(tooMuch.status).toBe(400);

    const ok = await payRoute(
      jsonRequest("http://local/api/pay", {
        billId: snapshot.bill.id,
        amountCents: 30000,
        tipCents: 3000,
        method: "qr",
        name: "Nombre demasiado largo para guardarse",
      }),
    );
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { paymentId: number; qrString: string };
    expect(body.qrString).toContain("PAYSHARE-MOCK");
    const row = await getPayment(body.paymentId);
    expect(row?.charged_cents).toBe(1);
    expect(row?.payer_name).toHaveLength(20);

    await closeBillRoute(new Request("http://local/api/bills/1/close", { method: "POST" }), {
      params: Promise.resolve({ id: String(snapshot.bill.id) }),
    });
    const closed = await payRoute(
      jsonRequest("http://local/api/pay", { billId: snapshot.bill.id, amountCents: 100, tipCents: 0, method: "qr" }),
    );
    expect(closed.status).toBe(409);
  });

  it("simular pago responde 404 fuera de mock", async () => {
    process.env.PEY_MODE = "live";
    const response = await simulateRoute(jsonRequest("http://local/api/dev/simulate", { paymentId: 1 }));
    expect(response.status).toBe(404);
  });

  it("markPaid dos veces deja la fila pagada una sola vez", async () => {
    const opened = await openBillRoute(jsonRequest("http://local/api/bills", { tableId: 1, totalCents: 10000 }));
    const snapshot = (await opened.json()) as { bill: { id: number } };
    const created = await payRoute(
      jsonRequest("http://local/api/pay", { billId: snapshot.bill.id, amountCents: 1000, tipCents: 0, method: "pn", phone: "5512345678" }),
    );
    const body = (await created.json()) as { paymentId: number };
    const first = await simulateRoute(jsonRequest("http://local/api/dev/simulate", { paymentId: body.paymentId }));
    const second = await simulateRoute(jsonRequest("http://local/api/dev/simulate", { paymentId: body.paymentId }));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const row = await getPayment(body.paymentId);
    expect(row?.status).toBe("paid");
    expect(row?.amount_cents).toBe(1000);
  });
});
