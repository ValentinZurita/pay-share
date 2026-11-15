"use client";

import { TipSelector, type TipMode } from "@/components/mesa/tip-selector";
import { CurrencyInput, Field, TextInput } from "@/components/ui/input";

/**
 * Diner payment form: part amount, tip selector, and optional payer name.
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
      <Field label="¿Cuánto pagas tú?" htmlFor="amount" error={error || undefined}>
        <CurrencyInput
          id="amount"
          enterKeyHint="done"
          invalid={Boolean(error)}
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <button
          type="button"
          onClick={onPayRemaining}
          className="min-h-11 self-start rounded px-0 py-2 text-[13.5px] font-medium text-primary"
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

      <Field label="Tu nombre" htmlFor="payer-name" hint="(opcional)">
        <TextInput
          id="payer-name"
          maxLength={20}
          autoComplete="given-name"
          placeholder="Para que la mesa vea quién pagó"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          inputClassName="text-[16px] font-medium"
        />
      </Field>
    </>
  );
}
