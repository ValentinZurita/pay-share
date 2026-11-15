import { formatMXN } from "@/lib/money";
import type { Snapshot } from "@/lib/types";

function clock(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Mexico_City",
  }).format(new Date(iso));
}

export function AccountCard({
  bill,
  restLabel,
  staff,
  freshIds,
}: {
  bill: NonNullable<Snapshot["bill"]>;
  restLabel: string;
  staff: boolean;
  freshIds?: Set<number>;
}) {
  const rows = staff ? bill.payments : bill.payments.filter((payment) => payment.status === "paid");
  return (
    <div className="card acct">
      <span className="lbl">Total de la cuenta</span>
      <span className="big num">{formatMXN(bill.totalCents)}</span>
      {rows.length > 0 ? (
        <ul>
          {rows.map((payment) => {
            const paid = payment.status === "paid";
            const when = staff && paid ? ` · ${clock(payment.paidAt ?? payment.createdAt)}` : "";
            return (
              <li key={payment.id} className={freshIds?.has(payment.id) ? "fresh" : undefined}>
                <span>
                  {payment.name || "Un comensal"}
                  <small className="num">{paid ? `Propina ${formatMXN(payment.tipCents)}${when}` : "Aún no paga"}</small>
                </span>
                {paid ? (
                  <span className="v num">{formatMXN(payment.amountCents)}</span>
                ) : (
                  <span className="badge neutral">Esperando</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="restante">
        <span className="lbl">{restLabel}</span>
        <span className="amt num">{bill.remainingCents === 0 ? "Cubierta" : formatMXN(bill.remainingCents)}</span>
      </div>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="diner-col" aria-busy="true">
      <div className="bar">
        <span className="sk" style={{ width: 28, height: 28, borderRadius: 99 }} />
        <span className="sk" style={{ width: 120 }} />
      </div>
      <div className="body">
        <div className="card acct">
          <span className="sk" style={{ width: 120 }} />
          <span className="sk" style={{ width: 160, height: 34, margin: "8px 0 14px" }} />
          <div className="restante">
            <span className="sk" style={{ width: 80 }} />
            <span className="sk" style={{ width: 120, height: 28 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
