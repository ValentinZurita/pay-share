import { describe, expect, it } from "vitest";
import { computeTotals } from "@/lib/totals";

const paid = (amountCents: number, tipCents = 0) => ({ amountCents, tipCents, status: "paid" as const });
const pending = (amountCents: number, tipCents = 0) => ({ amountCents, tipCents, status: "pending" as const });

describe("computeTotals", () => {
  it("no resta la propina del restante", () => {
    const totals = computeTotals(50000, [paid(30000, 3000)]);
    expect(totals.paidCents).toBe(30000);
    expect(totals.tipsCents).toBe(3000);
    expect(totals.remainingCents).toBe(20000);
  });

  it("ignora los pagos pendientes", () => {
    const totals = computeTotals(50000, [pending(30000, 3000), paid(10000, 500)]);
    expect(totals.paidCents).toBe(10000);
    expect(totals.tipsCents).toBe(500);
    expect(totals.remainingCents).toBe(40000);
  });

  it("el restante nunca es negativo y expone el excedente", () => {
    const totals = computeTotals(50000, [paid(60000, 1000)]);
    expect(totals.remainingCents).toBe(0);
    expect(totals.overpaidCents).toBe(10000);
    expect(totals.tipsCents).toBe(1000);
  });
});
