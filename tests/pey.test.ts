import { afterEach, describe, expect, it, vi } from "vitest";
import { numericRef, peyProvider } from "@/lib/payments/pey";

const input = {
  paymentId: 12,
  billId: 4,
  chargeCents: 1,
  concept: "Mesa 4 cuenta 4",
  expirationSeconds: 900,
  method: "qr" as const,
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PEY_API_KEY;
});

describe("numericRef", () => {
  it("solo usa dígitos y máximo 7", () => {
    expect(numericRef(12)).toBe("12");
    expect(numericRef(12345678)).toBe("2345678");
    expect(numericRef(10_000_000)).toBe("0");
    expect(numericRef(12345678)).toMatch(/^[0-9]{1,7}$/);
  });
});

describe("peyProvider", () => {
  it("manda el cuerpo exacto del QR y lee el 201", async () => {
    process.env.PEY_API_KEY = "pk_test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "QR1", qrString: "payload" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await peyProvider.createCharge(input);
    expect(result).toEqual({ qrId: "QR1", qrString: "payload" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.pey.mx/codi/qr");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer pk_test");
    expect(JSON.parse(String(init.body))).toEqual({
      amount: 0.01,
      concept: "Mesa 4 cuenta 4",
      expiration: 900,
      numRef: "12",
      metadata: { paymentId: 12, billId: 4 },
    });
  });

  it("el push usa 200 y no pide imagen", async () => {
    process.env.PEY_API_KEY = "pk_test";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ transactionId: "TX1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await peyProvider.createCharge({
      ...input,
      method: "pn",
      phone: "5512345678",
      expirationSeconds: 360,
    });
    expect(result.transactionId).toBe("TX1");
    const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.phoneNumber).toBe("5512345678");
    expect(body.expiration).toBe(360);
    expect(body.generateImage).toBeUndefined();
  });

  it("traduce 400 y 503 a español", async () => {
    process.env.PEY_API_KEY = "pk_test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "bad", type: "INVALID_AMOUNT", requestId: "req-1" } }), {
          status: 400,
        }),
      ),
    );
    await expect(peyProvider.createCharge(input)).rejects.toThrow("No se pudo crear el cobro");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { type: "SERVICE_UNAVAILABLE", requestId: "req-2" } }), { status: 503 }),
      ),
    );
    await expect(peyProvider.createCharge(input)).rejects.toThrow("no está disponible");
  });

  it("findPaid devuelve el id cuando el QR ya está pagado", async () => {
    process.env.PEY_API_KEY = "pk_test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [{ id: "TX9", status: "PAID" }] }), { status: 200 })),
    );
    await expect(peyProvider.findPaid({ qrId: "QR1" })).resolves.toBe("TX9");
  });
});
