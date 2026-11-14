import type { PaymentProvider } from "@/lib/payments/provider";

export const mockProvider: PaymentProvider = {
  async createCharge(input) {
    if (input.method === "pn") {
      return { transactionId: `mock-pn-${input.paymentId}` };
    }
    return {
      qrId: `mock-${input.paymentId}`,
      qrString: `PAYSHARE-MOCK-${input.paymentId}`,
    };
  },
  async findPaid() {
    return null;
  },
};
