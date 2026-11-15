import { Badge } from "@/components/ui/badge";
import { Card, type CardVariant } from "@/components/ui/card";
import { DinerShell, ScrollBody } from "@/components/ui/page-shell";
import { cn } from "@/lib/cn";
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

/**
 * Bill summary card displaying total, individual payments, and remaining balance.
 */
export function AccountCard({
  bill,
  restLabel,
  staff,
  freshIds,
  variant = "elevated",
}: {
  bill: NonNullable<Snapshot["bill"]>;
  restLabel: string;
  staff: boolean;
  freshIds?: Set<number>;
  variant?: CardVariant;
}) {
  const rows = staff ? bill.payments : bill.payments.filter((payment) => payment.status === "paid");

  return (
    <Card variant={variant} className="p-[18px]">
      <span className="text-[13px] font-medium text-muted">Total de la cuenta</span>
      <span className="mt-1 mb-3.5 block text-[34px] font-bold leading-[1.1] tracking-[-0.035em] text-ink num">
        {formatMXN(bill.totalCents)}
      </span>
      {rows.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((payment) => {
            const paid = payment.status === "paid";
            const when = staff && paid ? ` · ${clock(payment.paidAt ?? payment.createdAt)}` : "";
            return (
              <li
                key={payment.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-md",
                  freshIds?.has(payment.id) && "animate-[fresh_2s_var(--ease)]",
                )}
              >
                <span className="min-w-0 text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink [overflow-wrap:anywhere]">
                  {payment.name || "Un comensal"}
                  <small className="block text-[12.5px] font-normal tracking-normal text-muted num">
                    {paid ? `Propina ${formatMXN(payment.tipCents)}${when}` : "Aún no paga"}
                  </small>
                </span>
                {paid ? (
                  <span className="text-[15px] font-medium leading-[1.3] whitespace-nowrap text-ink num">
                    {formatMXN(payment.amountCents)}
                  </span>
                ) : (
                  <Badge variant="neutral">Esperando</Badge>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-col items-center gap-0.5 rounded-[10px] bg-primary-tint px-4 py-3.5 text-center">
        <span className="text-[13px] font-semibold text-primary-press">{restLabel}</span>
        <span className="text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-ink num">
          {bill.remainingCents === 0 ? "Cubierta" : formatMXN(bill.remainingCents)}
        </span>
      </div>
    </Card>
  );
}

/**
 * Loading skeleton matching the diner account view layout.
 */
export function AccountSkeleton() {
  return (
    <DinerShell aria-busy="true">
      <div className="flex min-h-[60px] flex-none items-center gap-2.5 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-2.5">
        <span className="h-7 w-7 rounded-full bg-neutral-bg" />
        <span className="h-3.5 w-[120px] rounded-lg bg-neutral-bg" />
      </div>
      <ScrollBody>
        <Card className="p-[18px]">
          <span className="block h-3.5 w-[120px] rounded-lg bg-neutral-bg" />
          <span className="mt-2 mb-3.5 block h-[34px] w-[160px] rounded-lg bg-neutral-bg" />
          <div className="mt-4 flex flex-col items-center gap-1.5 rounded-[10px] bg-primary-tint px-4 py-3.5">
            <span className="h-3.5 w-20 rounded-lg bg-neutral-bg" />
            <span className="h-7 w-[120px] rounded-lg bg-neutral-bg" />
          </div>
        </Card>
      </ScrollBody>
    </DinerShell>
  );
}
