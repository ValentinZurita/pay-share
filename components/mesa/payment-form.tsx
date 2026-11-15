"use client";

import { TipSelector, type TipMode } from "@/components/mesa/tip-selector";
import { TextInput } from "@/components/ui/input";
import { sanitizePesosInput } from "@/lib/money";

/**
 * Formulario del comensal: nombre, monto grande y propina.
 */
export function PaymentForm({
  amount,
  tipMode,
  tipCustom,
  tipCents,
  name,
  error,
  remainingLabel,
  shareLabel,
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
  remainingLabel: string;
  shareLabel: string;
  onAmountChange: (value: string) => void;
  onPayRemaining: () => void;
  onTipModeChange: (mode: TipMode) => void;
  onTipCustomChange: (value: string) => void;
  onNameChange: (value: string) => void;
}) {
  const width = `${Math.max(1, (amount || "0").length)}ch`;

  return (
    <>
      <section className="ps-pay-section">
        <div className="ps-pay-head">
          <label htmlFor="payer-name" className="text-[14px] font-medium text-fg2">
            Tu nombre <span className="font-normal text-fg3">(opcional)</span>
          </label>
        </div>
        <TextInput
          id="payer-name"
          maxLength={40}
          autoComplete="given-name"
          placeholder="Para que la mesa vea quién pagó"
          value={name}
          onChange={(event) => onNameChange(event.target.value.slice(0, 40))}
          textSize="md"
        />
      </section>

      <section className="ps-pay-section" aria-label="Monto">
        <div className="ps-pay-head">
          <label htmlFor="amount" className="text-[14px] font-medium text-fg2">
            ¿Cuánto pagas tú?
          </label>
        </div>
        <div className="ps-amount-card">
          <label className={error ? "ps-amount is-error" : "ps-amount"}>
            <span className="ps-amount-cur" aria-hidden="true">
              $
            </span>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder="0"
              aria-describedby="amount-msg"
              aria-invalid={error ? true : undefined}
              value={amount}
              onChange={(event) => onAmountChange(sanitizePesosInput(event.target.value))}
              className="ps-amount-input"
              style={{ width }}
            />
          </label>
          <p id="amount-msg" className={error ? "ps-amount-msg is-error" : "ps-amount-msg"} role={error ? "alert" : "status"}>
            {error || shareLabel}
          </p>
          <button type="button" className="ps-pill" onClick={onPayRemaining}>
            Pagar todo el restante · {remainingLabel}
          </button>
        </div>
      </section>

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
