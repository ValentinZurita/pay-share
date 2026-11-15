import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { IconCheck } from "@/components/ui/icons";
import { DinerShell, ScrollBody } from "@/components/ui/page-shell";
import { cn } from "@/lib/cn";
import { buildTicket, type TicketPendingInput, type TicketRow } from "@/lib/ticket";
import type { Snapshot } from "@/lib/types";

type Bill = NonNullable<Snapshot["bill"]>;

function Row({ row }: { row: TicketRow }) {
  return (
    <li className={cn("ps-ticket-row", row.you && "ps-ticket-you", row.fresh && "ps-ticket-fresh")}>
      <span className="ps-ticket-who">
        <b>{row.name}</b>
        <small>{row.detail}</small>
      </span>
      {row.waiting ? (
        <Badge variant="neutral">Esperando</Badge>
      ) : (
        <span className="ps-ticket-amt">{row.amount}</span>
      )}
    </li>
  );
}

/**
 * Cuenta en forma de ticket: muescas, perforación, talón y borde festoneado.
 * La sombra es drop-shadow del padre; adentro no hay desenfoque.
 */
export function Ticket({
  bill,
  restaurant,
  tableName,
  createdAt,
  staff = false,
  pending = null,
  freshIds,
}: {
  bill: Bill;
  restaurant: string;
  tableName: string;
  createdAt: string;
  staff?: boolean;
  pending?: TicketPendingInput | null;
  freshIds?: Set<number>;
}) {
  const model = buildTicket({
    restaurant,
    tableName,
    billId: bill.id,
    totalCents: bill.totalCents,
    createdAt,
    staff,
    pending,
    payments: bill.payments.map((payment) => ({
      id: payment.id,
      name: payment.name,
      amountCents: payment.amountCents,
      tipCents: payment.tipCents,
      status: payment.status,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      fresh: freshIds?.has(payment.id) ?? false,
    })),
  });
  const lines: ReactNode[] = model.rows.map((row) => <Row key={row.key} row={row} />);
  if (model.pending) lines.push(<Row key={model.pending.key} row={model.pending} />);

  return (
    <section className="ps-ticket" aria-label="La cuenta">
      <div className="ps-ticket-body">
        <div className="ps-ticket-head">
          <span className="ps-ticket-brand">{model.restaurant}</span>
          <span className="ps-ticket-meta">{model.meta}</span>
        </div>
        <div className="ps-ticket-rule" aria-hidden="true" />
        <div className="ps-ticket-line ps-ticket-total">
          <span>Total de la cuenta</span>
          <span className="ps-ticket-amt">{model.total}</span>
        </div>
        <div className="ps-ticket-rule" aria-hidden="true" />
        <span className="ps-ticket-label">{model.sectionLabel}</span>
        {model.empty ? (
          <p className="ps-ticket-empty">{model.empty}</p>
        ) : (
          <ul className="ps-ticket-list">{lines}</ul>
        )}
      </div>
      <div className="ps-ticket-stub">
        <div className="ps-ticket-rest">
          <span className="ps-ticket-rest-label">
            <span className="ps-ticket-label">{model.restLabel}</span>
            <small>de {model.total}</small>
          </span>
          {model.covered ? (
            <span className="ps-ticket-big ps-ticket-ok">
              <IconCheck />
              {model.big}
            </span>
          ) : (
            <span className="ps-ticket-big">{model.big}</span>
          )}
        </div>
        {model.bar ? (
          <div className="ps-ticket-bar" role="img" aria-label={model.barLabel}>
            <span className="ps-ticket-bar-paid" style={{ flex: `${model.bar.paid} 1 0` }} />
            {model.bar.pending > 0 ? (
              <span className="ps-ticket-bar-you" style={{ flex: `${model.bar.pending} 1 0` }} />
            ) : null}
            {model.bar.rest > 0 ? (
              <span className="ps-ticket-bar-rest" style={{ flex: `${model.bar.rest} 1 0` }} />
            ) : null}
          </div>
        ) : null}
        <p className="ps-ticket-cap">
          {model.caption.kind === "pending" ? (
            <>
              {model.caption.lead} <b>{model.caption.amount}</b>
            </>
          ) : (
            model.caption.text
          )}
        </p>
      </div>
      <div className="ps-ticket-edge" aria-hidden="true" />
    </section>
  );
}

/** Esqueleto de carga con la silueta del ticket. */
export function AccountSkeleton() {
  return (
    <DinerShell aria-busy="true">
      <div className="flex min-h-[60px] flex-none items-center gap-2.5 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-2.5">
        <span className="h-7 w-7 rounded-full bg-neutral-bg" />
        <span className="h-3.5 w-[120px] rounded-lg bg-neutral-bg" />
      </div>
      <ScrollBody>
        <div className="ps-ticket" aria-hidden="true">
          <div className="ps-ticket-body">
            <span className="mx-auto block h-3.5 w-[140px] rounded-lg bg-neutral-bg" />
            <span className="mx-auto block h-3 w-[180px] rounded-lg bg-neutral-bg" />
            <span className="mt-2 block h-5 w-[120px] rounded-lg bg-neutral-bg" />
          </div>
          <div className="ps-ticket-stub">
            <span className="block h-3.5 w-24 rounded-lg bg-neutral-bg" />
            <span className="block h-9 w-[140px] rounded-lg bg-neutral-bg" />
          </div>
          <div className="ps-ticket-edge" />
        </div>
      </ScrollBody>
    </DinerShell>
  );
}
