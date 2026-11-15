"use client";

import type { CSSProperties } from "react";
import { formatMXN, sanitizePesosInput } from "@/lib/money";

export type TipMode = "0" | "10" | "15" | "20" | "otra";

const TIP_OPTIONS: { id: TipMode; label: string }[] = [
  { id: "0", label: "No" },
  { id: "10", label: "10%" },
  { id: "15", label: "15%" },
  { id: "20", label: "20%" },
  { id: "otra", label: "Otra" },
];

/**
 * Propina como control segmentado: la pastilla se desliza hasta la opción elegida.
 */
export function TipSelector({
  tipMode,
  tipCustom,
  tipCents,
  onModeChange,
  onCustomChange,
}: {
  tipMode: TipMode;
  tipCustom: string;
  tipCents: number;
  onModeChange: (mode: TipMode) => void;
  onCustomChange: (value: string) => void;
}) {
  const index = Math.max(0, TIP_OPTIONS.findIndex((tip) => tip.id === tipMode));

  return (
    <section className="ps-pay-section">
      <div className="ps-pay-head">
        <span id="tip-label" className="text-[14px] font-medium text-fg2">
          Propina
        </span>
        <span className="mono text-[13.5px] font-medium text-fg">
          {tipCents > 0 ? `+ ${formatMXN(tipCents)}` : ""}
        </span>
      </div>
      <div
        className="ps-seg"
        role="group"
        aria-labelledby="tip-label"
        style={{ "--i": index } as CSSProperties}
      >
        <span className="ps-seg-thumb" aria-hidden="true" />
        {TIP_OPTIONS.map((tip) => (
          <button
            key={tip.id}
            type="button"
            aria-pressed={tipMode === tip.id}
            onClick={() => onModeChange(tip.id)}
          >
            {tip.label}
          </button>
        ))}
      </div>
      {tipMode === "otra" ? (
        <div className="ps-tip-custom">
          <div className="ps-tip-row">
            <label htmlFor="f-tip">Propina</label>
            <input
              id="f-tip"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="$0.00"
              value={tipCustom}
              onChange={(event) => onCustomChange(sanitizePesosInput(event.target.value))}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
