"use client";

import { TipSelector, type TipMode } from "@/components/mesa/tip-selector";
import { CurrencyInput, Field, TextInput } from "@/components/ui/input";
import { sanitizePesosInput } from "@/lib/money";

/**
 * Diner payment form: optional payer name, part amount, and tip selector.
 */
export function PaymentForm({
  amount,
  tipMode,
  tipCustom,
  tipCents,
  name,
  error,
  onAmountChange,
  onPayRemaining,
  onTipModeChange,
  onTipCustomChange,
  onNameChange,
}: {
  amount: string;
  tipMode: TipMode;
  tipCustom: string;
  tipCents: number;
  name: string;
  error: string;
  onAmountChange: (value: string) => void;
  onPayRemaining: () => void;
  onTipModeChange: (mode: TipMode) => void;
  onTipCustomChange: (value: string) => void;
  onNameChange: (value: string) => void;
}) {
  return (
    <>
      <Field label="Tu nombre" htmlFor="payer-name" hint="(opcional)">
        <TextInput
          id="payer-name"
          maxLength={20}
          autoComplete="given-name"
          placeholder="Para que la mesa vea quién pagó"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          textSize="md"
        />
      </Field>

      <Field label="¿Cuánto pagas tú?" htmlFor="amount" error={error || undefined}>
        <CurrencyInput
          id="amount"
          enterKeyHint="done"
          invalid={Boolean(error)}
          value={amount}
          onChange={(event) => onAmountChange(sanitizePesosInput(event.target.value))}
        />
        <button
          type="button"
          onClick={onPayRemaining}
          className="self-start rounded px-0 py-1 text-[13.5px] font-medium text-primary transition-colors hover:text-primary-press active:opacity-80"
        >
          Pagar todo el restante
        </button>
      </Field>

      <TipSelector
        tipMode={tipMode}
        tipCustom={tipCustom}
        tipCents={tipCents}
        onModeChange={onTipModeChange}
        onCustomChange={onTipCustomChange}
      />
    </>
  );
}
