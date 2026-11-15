"use client";

import { BottomSheet, SheetCancel } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { QrImage } from "@/components/ui/qr-image";
import { ErrorText } from "@/components/ui/text";
import { sanitizePesosInput } from "@/lib/money";

/**
 * Shared bottom sheet for opening a new bill or editing an open bill's total.
 */
export function BillAmountSheet({
  mode,
  tableName,
  total,
  error,
  sending,
  onTotalChange,
  onSubmit,
  onClose,
}: {
  mode: "open" | "edit";
  tableName: string;
  total: string;
  error: string;
  sending: boolean;
  onTotalChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  const isOpen = mode === "open";
  const inputId = isOpen ? "bill-total" : "edit-total";
  const width = `${Math.max(1, (total || "0").length)}ch`;

  return (
    <BottomSheet
      title={`${isOpen ? "Abrir cuenta" : "Editar monto"} · ${tableName}`}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <section className="ps-pay-section">
          <div className="ps-pay-head">
            <label htmlFor={inputId} className="text-[14px] font-medium text-fg2">
              Total de la cuenta
            </label>
          </div>
          <div className="ps-amount-card">
            <label className={error ? "ps-amount is-error" : "ps-amount"}>
              <span className="ps-amount-cur" aria-hidden="true">
                $
              </span>
              <input
                id={inputId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="done"
                autoFocus
                placeholder="0"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId}-msg` : undefined}
                value={total}
                onChange={(event) => onTotalChange(sanitizePesosInput(event.target.value))}
                className="ps-amount-input"
                style={{ width }}
              />
            </label>
            {error ? (
              <p id={`${inputId}-msg`} className="ps-amount-msg is-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </section>
        <Button variant="primary" type="submit" disabled={sending}>
          {sending
            ? isOpen
              ? "Abriendo cuenta…"
              : "Guardando…"
            : isOpen
              ? "Abrir cuenta"
              : "Guardar monto"}
        </Button>
        <SheetCancel />
      </form>
    </BottomSheet>
  );
}

/**
 * Bottom sheet displaying a table's QR code and shareable link.
 */
export function ShareTableSheet({
  tableName,
  mesaUrl,
  copied,
  onShareLink,
  onClose,
}: {
  tableName: string;
  mesaUrl: string;
  copied: boolean;
  onShareLink: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet title={`Código · ${tableName}`} onClose={onClose}>
      <div className="flex flex-col items-center gap-3 p-4 text-center">
        <QrImage value={mesaUrl} label={`Código para abrir ${tableName}`} />
        <p className="m-0 w-full text-[13px] text-muted [overflow-wrap:anywhere]">
          {mesaUrl.replace(/^https?:\/\//, "")}
        </p>
        <Button variant="primary" onClick={onShareLink}>
          {copied ? "Enlace copiado" : "Enviar enlace"}
        </Button>
      </div>
    </BottomSheet>
  );
}

/**
 * Confirmation bottom sheet for deleting a table.
 */
export function RemoveTableSheet({
  tableName,
  hasOpenBill,
  error,
  sending,
  onConfirm,
  onClose,
}: {
  tableName: string;
  hasOpenBill: boolean;
  error: string;
  sending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet title={`¿Eliminar la ${tableName}?`} onClose={onClose}>
      <p className="ps-sheet-sub">
        {hasOpenBill
          ? "Esta mesa tiene una cuenta abierta. Ciérrala antes de quitarla."
          : "Se borra esta mesa. Su código dejará de servir."}
      </p>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {hasOpenBill ? null : (
        <Button variant="primary" disabled={sending} onClick={onConfirm}>
          {sending ? "Eliminando mesa…" : "Sí, eliminar mesa"}
        </Button>
      )}
      <SheetCancel />
    </BottomSheet>
  );
}

/**
 * Confirmation bottom sheet for closing a table's bill.
 */
export function CloseTableSheet({
  tableName,
  copy,
  sending,
  onConfirm,
  onClose,
}: {
  tableName: string;
  copy: string;
  sending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet title={`¿Cerrar la ${tableName}?`} onClose={onClose}>
      <p className="ps-sheet-sub">{copy}</p>
      <Button variant="primary" disabled={sending} onClick={onConfirm}>
        {sending ? "Cerrando mesa…" : "Sí, cerrar mesa"}
      </Button>
      <SheetCancel />
    </BottomSheet>
  );
}
