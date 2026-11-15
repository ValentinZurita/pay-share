import { describe, expect, it } from "vitest";
import { buildTicket, type TicketPaymentInput, type TicketSource } from "@/lib/ticket";

const OPENED_AT = "2026-11-14T18:30:00.000Z";

const withPayments: TicketPaymentInput[] = [
  {
    id: 1,
    name: "Ana",
    amountCents: 46000,
    tipCents: 4600,
    status: "paid",
    paidAt: "2026-11-15T03:12:00.000Z",
  },
  {
    id: 2,
    name: "Luis",
    amountCents: 46000,
    tipCents: 6900,
    status: "paid",
    paidAt: "2026-11-15T03:14:00.000Z",
  },
  {
    id: 3,
    name: null,
    amountCents: 30000,
    tipCents: 0,
    status: "paid",
    paidAt: "2026-11-15T03:19:00.000Z",
  },
];

function source(overrides: Partial<TicketSource> = {}): TicketSource {
  return {
    restaurant: "Casa Nopal",
    tableName: "Mesa 4",
    billId: 12,
    totalCents: 184000,
    payments: withPayments,
    createdAt: OPENED_AT,
    ...overrides,
  };
}

describe("buildTicket CA-4", () => {
  it("muestra la fecha en que se abrió la cuenta", () => {
    const ticket = buildTicket(source());
    expect(ticket.meta).toBe("Mesa 4 · Cuenta 12 · 14 nov 2026");
    expect(buildTicket(source({ createdAt: "2026-01-02T06:00:00.000Z" })).meta).toBe(
      "Mesa 4 · Cuenta 12 · 2 ene 2026",
    );
  });

  it("cuenta $1,840 con pagos: renglones y restante correcto", () => {
    const ticket = buildTicket(source());
    expect(ticket.restaurant).toBe("CASA NOPAL");
    expect(ticket.total).toBe("$1,840.00");
    expect(ticket.rows.map((row) => row.name)).toEqual(["Ana", "Luis", "Un comensal"]);
    expect(ticket.rows.map((row) => row.amount)).toEqual(["−$460.00", "−$460.00", "−$300.00"]);
    expect(ticket.rows[0]?.detail).toBe("+ propina $46.00 · 21:12");
    expect(ticket.rows[2]?.detail).toBe("sin propina · 21:19");
    expect(ticket.pending).toBeNull();
    expect(ticket.sectionLabel).toBe("Ya pagaron");
    expect(ticket.remainingCents).toBe(62000);
    expect(ticket.projectedCents).toBe(62000);
    expect(ticket.big).toBe("$620.00");
    expect(ticket.percent).toBe(66);
    expect(ticket.restLabel).toBe("Restante");
    expect(ticket.caption).toEqual({ kind: "progress", text: "66% pagado" });
    expect(ticket.bar).toEqual({ paid: 122000, pending: 0, rest: 62000 });
  });

  it("sin pagos: no hay sección ni texto vacío y el restante es el total", () => {
    const ticket = buildTicket(source({ payments: [], billId: 13, totalCents: 184000 }));
    expect(ticket.rows).toEqual([]);
    expect(ticket.pending).toBeNull();
    expect(ticket.sectionLabel).toBeNull();
    expect(ticket).not.toHaveProperty("empty");
    expect(JSON.stringify(ticket)).not.toMatch(/Aún no entra|ningún pago|Aparecen aquí/);
    expect(ticket.remainingCents).toBe(184000);
    expect(ticket.big).toBe("$1,840.00");
    expect(ticket.percent).toBe(0);
    expect(ticket.caption).toEqual({ kind: "progress", text: "0% pagado" });
  });

  it("cubierta: restante $0.00 y el texto de la referencia", () => {
    const ticket = buildTicket(
      source({
        payments: [
          {
            id: 9,
            name: "Ana",
            amountCents: 184000,
            tipCents: 0,
            status: "paid",
            paidAt: "2026-11-15T03:40:00.000Z",
          },
        ],
      }),
    );
    expect(ticket.remainingCents).toBe(0);
    expect(ticket.projectedCents).toBe(0);
    expect(ticket.big).toBe("Cubierta");
    expect(ticket.covered).toBe(true);
    expect(ticket.caption).toEqual({ kind: "covered", text: "No falta nada por pagar." });
    expect(ticket.bar).toEqual({ paid: 184000, pending: 0, rest: 0 });
  });
});

describe("buildTicket CA-5", () => {
  it("nombre Ana y monto válido: renglón por pagar y restante proyectado", () => {
    const ticket = buildTicket(
      source({ pending: { name: "Ana", partCents: 31000, tipCents: 3100 } }),
    );
    expect(ticket.pending).toMatchObject({
      name: "Ana · por pagar",
      detail: "+ propina $31.00",
      amount: "−$310.00",
      you: true,
    });
    expect(ticket.remainingCents).toBe(62000);
    expect(ticket.projectedCents).toBe(31000);
    expect(ticket.big).toBe("$620.00");
    expect(ticket.caption).toEqual({
      kind: "pending",
      lead: "Después de tu pago quedarán",
      amount: "$310.00",
    });
    expect(ticket.bar).toEqual({ paid: 122000, pending: 31000, rest: 31000 });
    expect(ticket.sectionLabel).toBe("Ya pagaron");
  });

  it("pendiente sin nombre usa Tú", () => {
    const ticket = buildTicket(
      source({ pending: { name: "   ", partCents: 20000, tipCents: 0 } }),
    );
    expect(ticket.pending).toMatchObject({
      name: "Tú · por pagar",
      detail: "sin propina",
      amount: "−$200.00",
    });
    expect(ticket.projectedCents).toBe(42000);
  });

  it("monto 0 no muestra renglón pendiente", () => {
    const ticket = buildTicket(source({ pending: { name: "Ana", partCents: 0, tipCents: 0 } }));
    expect(ticket.pending).toBeNull();
    expect(ticket.projectedCents).toBe(62000);
    expect(ticket.caption).toEqual({ kind: "progress", text: "66% pagado" });
  });

  it("monto mayor al restante no muestra renglón pendiente", () => {
    const ticket = buildTicket(
      source({ pending: { name: "Ana", partCents: 62001, tipCents: 0 } }),
    );
    expect(ticket.pending).toBeNull();
    expect(ticket.projectedCents).toBe(62000);
    expect(ticket.bar).toEqual({ paid: 122000, pending: 0, rest: 62000 });
  });

  it("variante caja dice Restante en efectivo", () => {
    const ticket = buildTicket(source({ staff: true }));
    expect(ticket.restLabel).toBe("Restante en efectivo");
    expect(ticket.caption).toEqual({ kind: "progress", text: "66% pagado por transferencia" });
    expect(ticket.rows.every((row) => !row.waiting)).toBe(true);
  });

  it("en caja un pago en espera no mueve el restante", () => {
    const ticket = buildTicket(
      source({
        staff: true,
        payments: [
          ...withPayments,
          {
            id: 8,
            name: "Sofía",
            amountCents: 10000,
            tipCents: 0,
            status: "pending",
            createdAt: "2026-11-15T03:30:00.000Z",
          },
        ],
      }),
    );
    expect(ticket.remainingCents).toBe(62000);
    expect(ticket.rows.find((row) => row.name === "Sofía")).toMatchObject({
      waiting: true,
      detail: "Aún no paga",
      amount: null,
    });
    expect(ticket.caption).toEqual({ kind: "progress", text: "66% pagado por transferencia" });
  });
});
