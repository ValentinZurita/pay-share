"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { IconMore } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatMXN } from "@/lib/money";
import type { Snapshot } from "@/lib/types";

/**
 * Interactive table card showing current bill status, remaining balance, and quick actions.
 */
export function TableCard({
  table,
  selected,
  onSelect,
  onEditAmount,
  onRemove,
}: {
  table: Snapshot;
  selected: boolean;
  onSelect: () => void;
  onEditAmount: () => void;
  onRemove: () => void;
}) {
  const open = table.bill;
  const covered = open ? open.remainingCents === 0 : false;

  return (
    <Card
      selected={selected}
      className="relative min-h-[118px] w-full p-0 transition-shadow duration-150 ease-(--ease) hover:shadow-card-hover"
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-[118px] w-full flex-col justify-between gap-2.5 p-3.5 text-left"
      >
        <span className="flex flex-col items-start gap-1.5 pr-7">
          <b className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{table.table.name}</b>
          {!open ? (
            <Badge variant="neutral">Libre</Badge>
          ) : covered ? (
            <Badge variant="ok">Cubierta</Badge>
          ) : (
            <Badge variant="info">Abierta</Badge>
          )}
        </span>
        {open ? (
          <span>
            <span className="block text-[20px] font-bold leading-[1.15] tracking-[-0.03em] text-ink num">
              {formatMXN(open.remainingCents)}
            </span>
            <small className="text-[12.5px] text-muted">restante de {formatMXN(open.totalCents)}</small>
          </span>
        ) : null}
      </button>

      <DropdownMenu
        label={`Opciones de ${table.table.name}`}
        positioned={false}
        className="absolute top-1.5 right-1.5 z-2"
        menuClassName="top-[calc(100%+2px)]"
        trigger={({ open: menuOpen, toggle }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Opciones de ${table.table.name}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={toggle}
            className={cn(menuOpen && "bg-bg text-ink")}
          >
            <IconMore />
          </Button>
        )}
        items={[
          { label: "Editar monto", onSelect: onEditAmount },
          { label: "Eliminar mesa", onSelect: onRemove },
        ]}
      />
    </Card>
  );
}
