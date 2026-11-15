"use client";

import { TableCard } from "@/components/caja/table-card";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ScrollBody } from "@/components/ui/page-shell";
import { MutedNote } from "@/components/ui/text";
import { formatMXN } from "@/lib/money";
import type { Snapshot } from "@/lib/types";

/**
 * Cashier table list pane with header action, connection banners, and responsive table grid.
 */
export function TableGrid({
  tables,
  selectedId,
  sending,
  error,
  liveError,
  onAddTable,
  onSelectTable,
  onEditAmount,
  onRemoveTable,
}: {
  tables: Snapshot[];
  selectedId: number | null;
  sending: boolean;
  error: string;
  liveError: string | null;
  onAddTable: () => void;
  onSelectTable: (id: number) => void;
  onEditAmount: (table: Snapshot) => void;
  onRemoveTable: (table: Snapshot) => void;
}) {
  const cash = tables.reduce((sum, table) => sum + (table.bill?.remainingCents ?? 0), 0);

  return (
    <ScrollBody padding="none">
      <div className="ps-large-title">
        <div className="flex items-end justify-between gap-3">
          <h1>Mesas</h1>
          <Button variant="secondary" size="compact" className="mb-0.5 min-h-11" disabled={sending} onClick={onAddTable}>
            Nueva mesa
          </Button>
        </div>
        <p>
          Restante en efectivo: <b className="num text-fg">{formatMXN(cash)}</b>
        </p>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {liveError ? <Banner>{liveError}</Banner> : null}
      {tables.length === 0 ? <MutedNote>No hay mesas. Agrega la primera.</MutedNote> : null}
      <div className="ps-tgrid">
        {tables.map((table) => (
          <TableCard
            key={table.table.id}
            table={table}
            selected={selectedId === table.table.id}
            onSelect={() => onSelectTable(table.table.id)}
            onEditAmount={() => onEditAmount(table)}
            onRemove={() => onRemoveTable(table)}
          />
        ))}
      </div>
    </ScrollBody>
  );
}
