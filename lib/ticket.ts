import { formatMXN } from "@/lib/money";
import { computeTotals } from "@/lib/totals";

export type TicketPaymentInput = {
  id: number;
  name: string | null;
  amountCents: number;
  tipCents: number;
  status: "pending" | "paid";
  paidAt?: string | null;
  createdAt?: string | null;
  fresh?: boolean;
};

export type TicketPendingInput = {
  name: string;
  partCents: number;
  tipCents: number;
};

export type TicketSource = {
  restaurant: string;
  tableName: string;
  billId: number;
  totalCents: number;
  payments: TicketPaymentInput[];
  pending?: TicketPendingInput | null;
  staff?: boolean;
  /** ISO de cuando se abrió la cuenta. */
  createdAt: string;
};

export type TicketRow = {
  key: string;
  name: string;
  detail: string;
  amount: string | null;
  waiting: boolean;
  you: boolean;
  fresh: boolean;
};

export type TicketCaption =
  | { kind: "covered"; text: "No falta nada por pagar." }
  | { kind: "pending"; lead: "Después de tu pago quedarán"; amount: string }
  | { kind: "progress"; text: string };

export type TicketModel = {
  restaurant: string;
  meta: string;
  total: string;
  sectionLabel: "Ya pagaron" | "Pagos" | null;
  rows: TicketRow[];
  pending: TicketRow | null;
  restLabel: "Restante" | "Restante en efectivo";
  remainingCents: number;
  projectedCents: number;
  covered: boolean;
  big: string;
  percent: number;
  caption: TicketCaption;
  bar: { paid: number; pending: number; rest: number } | null;
  barLabel: string;
};

function clock(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Mexico_City",
  }).format(date);
}

function ticketDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Mexico_City",
  })
    .format(date)
    .replace(/\./g, "");
}

function tipDetail(tipCents: number, when: string): string {
  const tip = tipCents > 0 ? `+ propina ${formatMXN(tipCents)}` : "sin propina";
  return when ? `${tip} · ${when}` : tip;
}

function payerName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  return trimmed || "Un comensal";
}

/** Arma el ticket como `ticketHTML` de la referencia. No pinta nada. */
export function buildTicket(source: TicketSource): TicketModel {
  const staff = source.staff === true;
  const totals = computeTotals(source.totalCents, source.payments);
  const remainingCents = totals.remainingCents;
  const paidCents = totals.paidCents;
  const request = source.pending ?? null;
  const accepted =
    request !== null && request.partCents > 0 && request.partCents <= remainingCents ? request : null;
  const projectedCents = accepted ? remainingCents - accepted.partCents : remainingCents;
  const percent = source.totalCents > 0 ? Math.round((paidCents / source.totalCents) * 100) : 0;
  const covered = remainingCents === 0;

  const rows: TicketRow[] = [];
  for (const payment of source.payments) {
    if (payment.status === "paid") {
      rows.push({
        key: `pay-${payment.id}`,
        name: payerName(payment.name),
        detail: tipDetail(payment.tipCents, clock(payment.paidAt ?? payment.createdAt)),
        amount: `−${formatMXN(payment.amountCents)}`,
        waiting: false,
        you: false,
        fresh: payment.fresh === true,
      });
      continue;
    }
    if (!staff) continue;
    rows.push({
      key: `wait-${payment.id}`,
      name: payerName(payment.name),
      detail: "Aún no paga",
      amount: null,
      waiting: true,
      you: false,
      fresh: false,
    });
  }

  const pending: TicketRow | null = accepted
    ? {
        key: "you",
        name: `${accepted.name.trim() || "Tú"} · por pagar`,
        detail: tipDetail(accepted.tipCents, ""),
        amount: `−${formatMXN(accepted.partCents)}`,
        waiting: false,
        you: true,
        fresh: false,
      }
    : null;

  const hasSection = rows.length > 0 || pending !== null;
  const sectionLabel: TicketModel["sectionLabel"] = hasSection
    ? rows.some((row) => !row.waiting) || pending
      ? "Ya pagaron"
      : "Pagos"
    : null;

  const caption: TicketCaption = covered
    ? { kind: "covered", text: "No falta nada por pagar." }
    : accepted
      ? { kind: "pending", lead: "Después de tu pago quedarán", amount: formatMXN(projectedCents) }
      : {
          kind: "progress",
          text: staff ? `${percent}% pagado por transferencia` : `${percent}% pagado`,
        };

  const paidLabel = formatMXN(paidCents);
  const totalLabel = formatMXN(source.totalCents);
  const barLabel = accepted
    ? `${paidLabel} pagado de ${totalLabel}; tu parte cubriría ${formatMXN(accepted.partCents)} más`
    : `${paidLabel} pagado de ${totalLabel}`;

  return {
    restaurant: source.restaurant.trim().toLocaleUpperCase("es-MX"),
    meta: `${source.tableName} · Cuenta ${source.billId} · ${ticketDate(source.createdAt)}`,
    total: totalLabel,
    sectionLabel,
    rows,
    pending,
    restLabel: staff ? "Restante en efectivo" : "Restante",
    remainingCents,
    projectedCents,
    covered,
    big: covered ? "Cubierta" : formatMXN(remainingCents),
    percent,
    caption,
    bar:
      source.totalCents > 0
        ? { paid: paidCents, pending: accepted?.partCents ?? 0, rest: projectedCents }
        : null,
    barLabel,
  };
}
