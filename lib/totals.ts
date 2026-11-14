export type TotalPayment = {
  amountCents: number;
  tipCents: number;
  status: "pending" | "paid";
};

export type Totals = {
  paidCents: number;
  tipsCents: number;
  remainingCents: number;
  overpaidCents: number;
};

export function computeTotals(totalCents: number, payments: TotalPayment[]): Totals {
  let paidCents = 0;
  let tipsCents = 0;
  for (const payment of payments) {
    if (payment.status !== "paid") continue;
    paidCents += payment.amountCents;
    tipsCents += payment.tipCents;
  }
  return {
    paidCents,
    tipsCents,
    remainingCents: Math.max(0, totalCents - paidCents),
    overpaidCents: Math.max(0, paidCents - totalCents),
  };
}
