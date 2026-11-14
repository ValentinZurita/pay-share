import { peyMode } from "@/lib/env";
import { mockProvider } from "@/lib/payments/mock";
import { peyProvider } from "@/lib/payments/pey";

export type ChargeInput = {
  paymentId: number;
  billId: number;
  chargeCents: number;
  concept: string;
  expirationSeconds: number;
  method: "qr" | "pn";
  phone?: string;
};

export type ChargeResult = {
  qrId?: string;
  qrString?: string;
  transactionId?: string;
};

export interface PaymentProvider {
  createCharge(input: ChargeInput): Promise<ChargeResult>;
  /** ¿Pey ya tiene este cobro como pagado? Devuelve el transactionId si sí. */
  findPaid(ref: { qrId?: string; transactionId?: string }): Promise<string | null>;
}

export function getProvider(): PaymentProvider {
  return peyMode() === "live" ? peyProvider : mockProvider;
}
