"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const paid = open && open.totalCents > 0 ? Math.min(100, (open.paidCents / open.totalCents) * 100) : 0;

  return (
    <div className={cn("ps-tcard", !open && "is-free", selected && "is-selected")}>
      <button type="button" className="ps-tcard-hit" onClick={onSelect}>
        <span className="ps-tcard-top">
          <b>{table.table.name}</b>
          {!open ? (
            <Badge variant="neutral">Libre</Badge>
          ) : covered ? (
            <Badge variant="ok">Cubierta</Badge>
          ) : (
            <Badge variant="info">Abierta</Badge>
          )}
        </span>
        {open ? (
          <>
            <span className="ps-tcard-amt">{covered ? "Lista" : formatMXN(open.remainingCents)}</span>
            <small>{covered ? "para cerrar" : `restante de ${formatMXN(open.totalCents)}`}</small>
            <span className="ps-tmini" aria-hidden="true">
              <i style={{ width: `${paid}%` }} />
            </span>
          </>
        ) : (
          <>
            <span className="ps-tplus" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <small>Abrir cuenta</small>
          </>
        )}
      </button>

      <DropdownMenu
        label={`Opciones de ${table.table.name}`}
        positioned={false}
        className="ps-tcard-menu"
        menuClassName="top-[calc(100%+2px)]"
        trigger={({ open: menuOpen, toggle }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Opciones de ${table.table.name}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={toggle}
          >
            <IconMore />
          </Button>
        )}
        items={[
          { label: "Editar monto", onSelect: onEditAmount },
          { label: "Eliminar mesa", onSelect: onRemove },
        ]}
      />
    </div>
  );
}
