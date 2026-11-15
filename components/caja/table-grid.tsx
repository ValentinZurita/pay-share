"use client";

import { TableCard } from "@/components/caja/table-card";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ScrollBody } from "@/components/ui/page-shell";
import { MutedNote, PageTitle } from "@/components/ui/text";
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
  return (
    <ScrollBody className="px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-6 min-[900px]:px-1 min-[900px]:pt-1 min-[900px]:pb-6">
      <div className="flex items-center justify-between gap-3">
        <PageTitle>Mesas</PageTitle>
        <Button variant="secondary" size="compact" disabled={sending} onClick={onAddTable}>
          Nueva mesa
        </Button>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      {liveError ? <Banner>{liveError}</Banner> : null}
      {tables.length === 0 ? <MutedNote>No hay mesas. Agrega la primera.</MutedNote> : null}
      <div className="grid grid-cols-2 gap-2.5 min-[600px]:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] min-[600px]:gap-3 min-[900px]:grid-cols-[repeat(auto-fill,minmax(185px,1fr))] min-[900px]:gap-3.5">
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
