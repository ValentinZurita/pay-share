import { AppError } from "@/lib/errors";
import { peyApiKey } from "@/lib/env";
import { centsToPesos } from "@/lib/money";
import type { ChargeInput, ChargeResult, PaymentProvider } from "@/lib/payments/provider";

const PEY_URL = "https://api.pey.mx";
const TIMEOUT_MS = 10_000;

export function numericRef(paymentId: number): string {
  const value = String(Math.abs(Math.trunc(paymentId)) % 10_000_000);
  if (!/^[0-9]{1,7}$/.test(value)) {
    throw new AppError(500, "No se pudo crear la referencia del cobro.");
  }
  return value;
}

type PeyErrorBody = {
  error?: { message?: string; type?: string; requestId?: string | null };
};

const MAINTENANCE =
  "El servicio de cobro no está disponible en este momento. Inténtalo en un minuto o paga en efectivo.";
const PUSH_FAILED =
  "No pudimos enviar el cobro a ese número. Revisa que sea el de tu banco o usa el código QR.";
const CHARGE_FAILED = "No se pudo crear el cobro. Inténtalo de nuevo.";

async function peyFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${PEY_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${peyApiKey()}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error("Pey no respondió", error instanceof Error ? error.name : "error");
    throw new AppError(502, CHARGE_FAILED);
  }
}

async function readError(response: Response, method: ChargeInput["method"]): Promise<AppError> {
  let body: PeyErrorBody = {};
  try {
    body = (await response.json()) as PeyErrorBody;
  } catch {
    body = {};
  }
  console.error("Pey rechazó el cobro", {
    status: response.status,
    type: body.error?.type,
    requestId: body.error?.requestId,
  });
  if (response.status === 503) return new AppError(503, MAINTENANCE);
  if (method === "pn") return new AppError(502, PUSH_FAILED);
  return new AppError(502, CHARGE_FAILED);
}

async function createQr(input: ChargeInput): Promise<ChargeResult> {
  const response = await peyFetch("/codi/qr", {
    method: "POST",
    body: JSON.stringify({
      amount: centsToPesos(input.chargeCents),
      concept: input.concept,
      expiration: input.expirationSeconds,
      numRef: numericRef(input.paymentId),
      metadata: { paymentId: input.paymentId, billId: input.billId },
    }),
  });
  if (response.status !== 201) throw await readError(response, "qr");
  const body = (await response.json()) as { id?: string; qrString?: string };
  if (!body.id || !body.qrString) throw new AppError(502, CHARGE_FAILED);
  return { qrId: body.id, qrString: body.qrString };
}

async function createPush(input: ChargeInput): Promise<ChargeResult> {
  const response = await peyFetch("/codi/pn", {
    method: "POST",
    body: JSON.stringify({
      amount: centsToPesos(input.chargeCents),
      phoneNumber: input.phone,
      concept: input.concept,
      expiration: input.expirationSeconds,
      numRef: numericRef(input.paymentId),
      metadata: { paymentId: input.paymentId, billId: input.billId },
    }),
  });
  if (response.status !== 200) throw await readError(response, "pn");
  const body = (await response.json()) as { transactionId?: string };
  if (!body.transactionId) throw new AppError(502, PUSH_FAILED);
  return { transactionId: body.transactionId };
}

type QrTransactions = { items?: { id?: string; status?: string }[] };
type Transaction = { id?: string; status?: string };

export const peyProvider: PaymentProvider = {
  async createCharge(input) {
    if (input.method === "pn") return createPush(input);
    return createQr(input);
  },

  async findPaid(ref) {
    if (ref.qrId) {
      const response = await peyFetch(`/transaction/codi/qr/${encodeURIComponent(ref.qrId)}`, { method: "GET" });
      if (!response.ok) return null;
      const body = (await response.json()) as QrTransactions;
      const paid = body.items?.find((item) => item.status === "PAID" && item.id);
      return paid?.id ?? null;
    }
    if (ref.transactionId) {
      const response = await peyFetch(`/transaction/${encodeURIComponent(ref.transactionId)}`, { method: "GET" });
      if (!response.ok) return null;
      const body = (await response.json()) as Transaction;
      return body.status === "PAID" ? (body.id ?? ref.transactionId) : null;
    }
    return null;
  },
};
