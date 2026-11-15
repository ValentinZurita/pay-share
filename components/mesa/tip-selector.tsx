"use client";

import { CurrencyInput, Field } from "@/components/ui/input";
import { cn } from "@/lib/cn";
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
 * Tip percentage selector with an optional custom MXN amount input.
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
  return (
    <Field
      label="Propina"
      headerEnd={
        <span className="text-[13.5px] font-medium text-warn num">
          {tipCents > 0 ? `+ ${formatMXN(tipCents)}` : ""}
        </span>
      }
    >
      <div className="grid grid-cols-5 gap-1.5 max-[380px]:gap-1" role="group" aria-label="Propina">
        {TIP_OPTIONS.map((tip) => {
          const active = tipMode === tip.id;
          return (
            <button
              key={tip.id}
              type="button"
              aria-pressed={active}
              onClick={() => onModeChange(tip.id)}
              className={cn(
                "min-h-11 rounded-lg bg-surface text-[14px] shadow-card transition-[background,box-shadow,color,transform] duration-150 ease-(--ease) active:scale-[0.97]",
                active
                  ? "font-semibold text-primary shadow-[0_0_0_1.5px_var(--primary),0_2px_5px_rgba(99,91,255,0.18)]"
                  : "font-medium text-text hover:bg-bg hover:text-ink hover:shadow-card-hover",
              )}
            >
              {tip.label}
            </button>
          );
        })}
      </div>
      {tipMode === "otra" ? (
        <div className="animate-[fade_0.18s_ease-out]">
          <CurrencyInput
            aria-label="Propina en pesos"
            value={tipCustom}
            onChange={(event) => onCustomChange(sanitizePesosInput(event.target.value))}
          />
        </div>
      ) : null}
    </Field>
  );
}
