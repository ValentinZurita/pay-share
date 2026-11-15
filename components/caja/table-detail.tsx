"use client";

import { Ticket } from "@/components/ui/ticket";
import { Button } from "@/components/ui/button";
import { KeyValueList } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { IconBack, IconMore } from "@/components/ui/icons";
import { FooterBar, ScrollBody } from "@/components/ui/page-shell";
import { ErrorText, MutedNote } from "@/components/ui/text";
import { formatMXN } from "@/lib/money";
import type { Snapshot } from "@/lib/types";

/**
 * Cashier detail pane showing live bill breakdown, tips, and close-table action.
 */
export function TableDetail({
  table,
  bill,
  freshIds,
  copied,
  error,
  onBack,
  onShowShare,
  onShareLink,
  onRequestClose,
}: {
  table: Snapshot["table"];
  bill: NonNullable<Snapshot["bill"]>;
  freshIds: Set<number>;
  copied: boolean;
  error: string;
  onBack: () => void;
  onShowShare: () => void;
  onShareLink: () => void;
  onRequestClose: () => void;
}) {
  const restaurant = process.env.NEXT_PUBLIC_RESTAURANT_NAME?.trim() ?? "";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden min-[900px]:h-full min-[900px]:rounded-2xl min-[900px]:bg-surface min-[900px]:shadow-card">
      <header className="grid min-h-[60px] flex-none grid-cols-[44px_minmax(0,1fr)_44px] items-center justify-items-center gap-2.5 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-2.5 min-[900px]:flex min-[900px]:min-h-0 min-[900px]:justify-between min-[900px]:border-b min-[900px]:border-line min-[900px]:px-5 min-[900px]:pt-[18px] min-[900px]:pb-3.5">
        <Button
          variant="surface"
          size="icon"
          aria-label="Volver a las mesas"
          onClick={onBack}
          className="justify-self-start min-[900px]:hidden"
        >
          <IconBack />
        </Button>
        <h1 className="m-0 min-w-0 text-center text-[17px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink min-[900px]:text-left">
          {table.name}
          <small className="mt-0.5 block text-[12px] font-medium tracking-normal text-muted">
            Cuenta {bill.id}
          </small>
        </h1>
        <DropdownMenu
          label="Opciones de la mesa"
          className="justify-self-end"
          trigger={({ open, toggle }) => (
            <Button
              variant="surface"
              size="icon"
              aria-label="Opciones de la mesa"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={toggle}
            >
              <IconMore />
            </Button>
          )}
          items={[
            { label: "Ver código", onSelect: onShowShare },
            { label: "Enviar enlace", onSelect: onShareLink },
          ]}
        />
      </header>

      <ScrollBody className="min-[900px]:gap-4 min-[900px]:p-5">
        {copied ? <MutedNote role="status">Enlace copiado.</MutedNote> : null}
        <Ticket
          bill={bill}
          restaurant={restaurant}
          tableName={table.name}
          createdAt={bill.createdAt}
          staff
          freshIds={freshIds}
        />
        <KeyValueList
          variant="bordered"
          items={[
            { label: "Pagado por transferencia", value: formatMXN(bill.paidCents) },
            { label: "Propinas, aparte", value: formatMXN(bill.tipsCents), accent: "warn" },
          ]}
        />
      </ScrollBody>

      <FooterBar className="min-[900px]:border-t min-[900px]:border-line min-[900px]:px-5 min-[900px]:py-4 min-[900px]:shadow-none">
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button variant="secondary" onClick={onRequestClose}>
          Cerrar mesa
        </Button>
      </FooterBar>
    </div>
  );
}
