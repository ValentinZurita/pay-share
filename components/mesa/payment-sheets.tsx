"use client";

import type { ReactNode } from "react";
import { BottomSheet, SheetCancel } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { IconGo, IconPhone, IconQr } from "@/components/ui/icons";
import { Field, TextInput } from "@/components/ui/input";
import { formatMXN } from "@/lib/money";

function MethodOption({
  icon,
  iconTone,
  title,
  subtitle,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  iconTone: "phone" | "qr";
  title: string;
  subtitle: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="ps-opt">
      <span className={iconTone === "phone" ? "ps-opt-ic ps-opt-ic-phone" : "ps-opt-ic ps-opt-ic-qr"}>{icon}</span>
      <span className="ps-opt-tx">
        <b className="block">{title}</b>
        <small>{subtitle}</small>
      </span>
      <span className="ps-opt-chev">
        <IconGo />
      </span>
    </button>
  );
}

/**
 * Bottom sheet allowing the diner to choose between phone push or QR CoDi payment.
 */
export function PaymentMethodSheet({
  totalCents,
  sending,
  onClose,
  onSelectPhone,
  onSelectQr,
}: {
  totalCents: number;
  sending: boolean;
  onClose: () => void;
  onSelectPhone: () => void;
  onSelectQr: () => void;
}) {
  return (
    <BottomSheet title="¿Cómo quieres pagar?" onClose={onClose}>
      <p className="ps-sheet-sub">
        Total <span className="num text-fg">{formatMXN(totalCents)}</span>
      </p>
      <div className="ps-opts">
        <MethodOption
          icon={<IconPhone />}
          iconTone="phone"
          title="Cobro a mi celular"
          subtitle="Te llega a la app de tu banco"
          onClick={onSelectPhone}
        />
        <MethodOption
          icon={<IconQr />}
          iconTone="qr"
          title="Código QR"
          subtitle="Para guardarlo o escanearlo"
          disabled={sending}
          onClick={onSelectQr}
        />
      </div>
      <SheetCancel />
    </BottomSheet>
  );
}

/**
 * Bottom sheet for entering a 10-digit phone number to send a CoDi push charge.
 */
export function PhoneChargeSheet({
  phone,
  totalCents,
  error,
  sending,
  onPhoneChange,
  onSubmit,
  onClose,
}: {
  phone: string;
  totalCents: number;
  error: string;
  sending: boolean;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet title="¿A qué celular enviamos el cobro?" onClose={onClose}>
      <p className="ps-sheet-sub">
        El que tienes registrado en tu banco. Solo lo usamos para este cobro y no lo guardamos.
      </p>
      <Field error={error || undefined}>
        <TextInput
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="10 dígitos"
          aria-label="Celular a 10 dígitos"
          invalid={Boolean(error)}
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
          className="ps-phone-field"
        />
      </Field>
      <Button
        variant="primary"
        type="button"
        disabled={!/^\d{10}$/.test(phone) || sending}
        onClick={onSubmit}
      >
        {sending ? "Enviando cobro…" : `Enviar cobro de ${formatMXN(totalCents)}`}
      </Button>
      <SheetCancel />
    </BottomSheet>
  );
}
